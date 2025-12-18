import mongoose, { PipelineStage } from "mongoose";
import { Sell } from "../mercent/mercentSellManagement/mercentSellManagement.model";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface AnalyticsFilters {
  subscriptionStatus?: string;
  customerName?: string;
  location?: string;
}

const getBusinessCustomerAnalytics = async (
  merchantId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 10,
  filters?: AnalyticsFilters
) => {
  /* ---------------- Base Match ---------------- */
  const matchSell: Record<string, any> = {
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: "completed",
  };

  if (startDate && endDate) {
    matchSell.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  /* ---------------- Customer Filters ---------------- */
  const matchCustomer: Record<string, any> = {};

  if (filters?.subscriptionStatus) {
    matchCustomer["customer.subscription"] = filters.subscriptionStatus;
  }

  if (filters?.customerName) {
    matchCustomer["customer.firstName"] = {
      $regex: filters.customerName,
      $options: "i",
    };
  }

  if (filters?.location) {
    matchCustomer["customer.address"] = {
      $regex: filters.location,
      $options: "i",
    };
  }

  const customerMatchStage: PipelineStage[] = Object.keys(matchCustomer).length
    ? [{ $match: matchCustomer }]
    : [];

  const skip = (page - 1) * limit;

  /* ---------------- Records ---------------- */
  const recordsPipeline: PipelineStage[] = [
    { $match: matchSell },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },
    ...customerMatchStage,
    {
      $project: {
        _id: 0,
        customerId: "$customer.customUserId",
        customerName: "$customer.firstName",
        subscriptionStatus: "$customer.subscription",
        location: "$customer.address",
        date: "$createdAt",
        revenue: "$discountedBill",
        pointsAccumulated: "$pointsEarned",
        pointsRedeemed: "$pointRedeemed",
      },
    },
    { $sort: { date: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const records = await Sell.aggregate(recordsPipeline);

  /* ---------------- Pagination Count ---------------- */
  const totalAgg = await Sell.aggregate<{
    total: number;
  }>([
    { $match: matchSell },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },
    ...customerMatchStage,
    { $count: "total" },
  ]);

  const total = totalAgg[0]?.total ?? 0;

  /* ---------------- Monthly Aggregation ---------------- */
  const rawMonthly = await Sell.aggregate([
    { $match: matchSell },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },
    ...customerMatchStage,
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalRevenue: { $sum: "$discountedBill" },
        totalPointsAccumulated: { $sum: "$pointsEarned" },
        totalPointsRedeemed: { $sum: "$pointRedeemed" },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        monthName: {
          $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }],
        },
        totalRevenue: 1,
        totalPointsAccumulated: 1,
        totalPointsRedeemed: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  /* ---------------- Fill Missing Months ---------------- */
  const monthMap = new Map(rawMonthly.map((m) => [`${m.year}-${m.month}`, m]));

  const filledMonthlyData: any[] = [];
  const cursor = new Date(startDate as string);
  const end = new Date(endDate as string);

  cursor.setDate(1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const data = monthMap.get(`${year}-${month}`);

    filledMonthlyData.push({
      year,
      month,
      monthName: monthNames[month - 1],
      totalRevenue: data?.totalRevenue || 0,
      totalPointsAccumulated: data?.totalPointsAccumulated || 0,
      totalPointsRedeemed: data?.totalPointsRedeemed || 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    pagination: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: {
      records,
      monthlyData: filledMonthlyData,
    },
  };
};

const getMerchantAnalytics = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10
) => {
  const filter: any = { status: "completed" };

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const skip = (page - 1) * limit;

  const records = await Sell.aggregate([
    { $match: filter },

    // Join with merchant info
    {
      $lookup: {
        from: "users",
        localField: "merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },

    // Group by merchant
    {
      $group: {
        _id: "$merchantId",
        merchantName: { $first: "$merchant.firstName" },
        location: { $first: "$merchant.address" },
        subscriptionStatus: { $first: "$merchant.subscription" },
        totalRevenue: { $sum: "$discountedBill" },
        pointsRedeemed: { $sum: "$pointRedeemed" },
        users: { $addToSet: "$userId" },
        joiningDate: { $first: "$merchant.createdAt" },
      },
    },

    // Add usersCount and remove users array
    {
      $addFields: {
        usersCount: { $size: "$users" },
      },
    },
    { $project: { users: 0 } }, // remove users array

    { $sort: { joiningDate: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  const total = await Sell.distinct("merchantId", filter);

  return {
    pagination: {
      page,
      limit,
      total: total.length,
      totalPage: Math.ceil(total.length / limit),
    },
    records,
  };
};

const getCustomerAnalytics = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10
) => {
  const filter: any = {
    status: "completed",
  };

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const skip = (page - 1) * limit;

  // Total count for pagination
  const total = await Sell.countDocuments(filter);

  const records = await Sell.aggregate([
    { $match: filter },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },

    {
      $project: {
        _id: 0,
        userId: "$customer._id",
        customUserId: "$customer.customUserId",
        customerName: "$customer.firstName",
        location: "$customer.address",
        subscriptionStatus: "$customer.subscription",
        date: "$createdAt",
        pointsAccumulated: "$pointsEarned",
        pointsRedeemed: "$pointRedeemed",
      },
    },

    { $sort: { date: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  return {
    pagination: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },

    records,
  };
};
export const AnalyticsService = {
  getBusinessCustomerAnalytics,
  getMerchantAnalytics,
  getCustomerAnalytics,
};
