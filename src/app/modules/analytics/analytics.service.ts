import mongoose from "mongoose";
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

const getBusinessCustomerAnalytics = async (
  merchantId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 10
) => {
  const filter: any = {
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: "completed",
  };

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const skip = (page - 1) * limit;

  /* ---------------- Pagination ---------------- */
  const total = await Sell.countDocuments(filter);

  /* ---------------- Records ---------------- */
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
        customerName: "$customer.firstName",
        subscriptionStatus: "$customer.subscription",
        date: "$createdAt",
        revenue: "$discountedBill",
        pointsAccumulated: "$pointsEarned",
        pointsRedeemed: "$pointRedeemed",
      },
    },
    { $sort: { date: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  /* ---------------- Monthly Aggregation ---------------- */
  const rawMonthly = await Sell.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalRevenue: { $sum: "$discountedBill" },
        totalPointsRedeemed: { $sum: "$pointRedeemed" },
        users: { $addToSet: "$userId" },
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
        totalPointsRedeemed: 1,
        users: { $size: "$users" },
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
    const key = `${year}-${month}`;

    const data = monthMap.get(key);

    filledMonthlyData.push({
      year,
      month,
      monthName: monthNames[month - 1],
      totalRevenue: data?.totalRevenue || 0,
      totalPointsRedeemed: data?.totalPointsRedeemed || 0,
      users: data?.users || 0,
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
