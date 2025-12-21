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

interface AnalyticsFilters {
  subscriptionStatus?: string;
  merchantName?: string;
  location?: string;
}

const getMerchantAnalytics = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters
) => {
  /* ---------------- Base Match ---------------- */
  const matchSell: Record<string, any> = { status: "completed" };

  if (startDate && endDate) {
    matchSell.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  /* ---------------- Merchant Filters ---------------- */
  const matchMerchant: Record<string, any> = {};
  if (filters?.subscriptionStatus) {
    matchMerchant["merchant.subscription"] = filters.subscriptionStatus;
  }
  if (filters?.merchantName) {
    matchMerchant["merchant.firstName"] = {
      $regex: filters.merchantName,
      $options: "i",
    };
  }
  if (filters?.location) {
    matchMerchant["merchant.address"] = {
      $regex: filters.location,
      $options: "i",
    };
  }

  const merchantMatchStage: PipelineStage[] = Object.keys(matchMerchant).length
    ? [{ $match: matchMerchant }]
    : [];

  const skip = (page - 1) * limit;

  /* ---------------- Records Pipeline ---------------- */
  const recordsPipeline: PipelineStage[] = [
    { $match: matchSell },
    {
      $lookup: {
        from: "users",
        localField: "merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },
    ...merchantMatchStage,
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
    { $addFields: { usersCount: { $size: "$users" } } },
    { $project: { users: 0 } },
    { $sort: { joiningDate: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const records = await Sell.aggregate(recordsPipeline);

  /* ---------------- Pagination Count ---------------- */
  const totalAgg = await Sell.aggregate([
    { $match: matchSell },
    {
      $lookup: {
        from: "users",
        localField: "merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },
    ...merchantMatchStage,
    { $group: { _id: "$merchantId" } },
    { $count: "total" },
  ]);

  const total = totalAgg[0]?.total ?? 0;

  /* ---------------- Monthly Aggregation ---------------- */
  const rawMonthly = await Sell.aggregate([
    { $match: matchSell },
    {
      $lookup: {
        from: "users",
        localField: "merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },
    ...merchantMatchStage,
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        totalRevenue: { $sum: "$discountedBill" },
        pointsRedeemed: { $sum: "$pointRedeemed" },
        usersSet: { $addToSet: "$userId" },
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
        pointsRedeemed: 1,
        usersCount: { $size: "$usersSet" },
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
      pointsRedeemed: data?.pointsRedeemed || 0,
      usersCount: data?.usersCount || 0,
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

interface AnalyticsFilters {
  subscriptionStatus?: string;
  customerName?: string;
  location?: string;
}

const getCustomerAnalytics = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters
) => {
  /* ---------------- Base Match ---------------- */
  const matchSell: Record<string, any> = { status: "completed" };

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

  /* ---------------- Records Pipeline ---------------- */
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
  ];

  const records = await Sell.aggregate(recordsPipeline);

  /* ---------------- Pagination Count ---------------- */
  const totalAgg = await Sell.aggregate([
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
    { $group: { _id: "$userId" } },
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
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        pointsAccumulated: { $sum: "$pointsEarned" },
        pointsRedeemed: { $sum: "$pointRedeemed" },
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
        pointsAccumulated: 1,
        pointsRedeemed: 1,
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
      pointsAccumulated: data?.pointsAccumulated || 0,
      pointsRedeemed: data?.pointsRedeemed || 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    pagination: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: { records, monthlyData: filledMonthlyData },
  };
};


// service.ts
const getMerchantAnalyticsExport = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters
) => {
  // ---------------- Base Match ----------------
  const matchSell: Record<string, any> = { status: "completed" };
  if (startDate && endDate) {
    matchSell.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // ---------------- Merchant Filters ----------------
  const matchMerchant: Record<string, any> = {};
  if (filters?.subscriptionStatus) {
    matchMerchant["merchant.subscription"] = filters.subscriptionStatus;
  }
  if (filters?.merchantName) {
    matchMerchant["merchant.firstName"] = {
      $regex: filters.merchantName,
      $options: "i",
    };
  }
  if (filters?.location) {
    matchMerchant["merchant.address"] = {
      $regex: filters.location,
      $options: "i",
    };
  }

  const merchantMatchStage: PipelineStage[] =
    Object.keys(matchMerchant).length > 0 ? [{ $match: matchMerchant }] : [];

  // ---------------- Records Pipeline ----------------
  const recordsPipeline: PipelineStage[] = [
    { $match: matchSell },
    {
      $lookup: {
        from: "users",
        localField: "merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },
    ...merchantMatchStage,
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
    { $addFields: { usersCount: { $size: "$users" } } },
    { $project: { users: 0 } },
    { $sort: { joiningDate: -1 } },
  ];

  // Apply skip/limit only if limit > 0
  if (limit > 0) {
    recordsPipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
  }

  const records = await Sell.aggregate(recordsPipeline);

  return { records };
};


export const AnalyticsService = {
  getBusinessCustomerAnalytics,
  getMerchantAnalytics,
  getCustomerAnalytics,
  getMerchantAnalyticsExport
};
