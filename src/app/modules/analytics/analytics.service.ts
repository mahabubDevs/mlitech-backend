import mongoose, { PipelineStage } from "mongoose";
import { Sell } from "../mercent/mercentSellManagement/mercentSellManagement.model";
import { generateExcelBuffer } from "../../../helpers/excelExport";
import ExcelJS from "exceljs";
import PointTransaction from "../pointTransaction/pointTransaction.model";
import { Subscription } from "../subscription/subscription.model";

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


const exportBusinessCustomerAnalytics = async (
  merchantId: string,
  startDate?: string,
  endDate?: string,
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

  const customerMatchStage =
    Object.keys(matchCustomer).length > 0
      ? [{ $match: matchCustomer }]
      : [];

  /* ---------------- Aggregation ---------------- */
  const records = await Sell.aggregate([
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
  ]);

  /* ---------------- Excel Generate ---------------- */
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Customer Analytics");

  worksheet.columns = [
    { header: "Customer ID", key: "customerId", width: 18 },
    { header: "Customer Name", key: "customerName", width: 25 },
    { header: "Subscription Status", key: "subscriptionStatus", width: 20 },
    { header: "Location", key: "location", width: 30 },
    { header: "Date", key: "date", width: 20 },
    { header: "Revenue", key: "revenue", width: 15 },
    { header: "Points Earned", key: "pointsAccumulated", width: 18 },
    { header: "Points Redeemed", key: "pointsRedeemed", width: 18 },
  ];

  records.forEach((item) => {
    worksheet.addRow({
      customerId: item.customerId,
      customerName: item.customerName,
      subscriptionStatus: item.subscriptionStatus,
      location: item.location,
      date: new Date(item.date).toISOString(),
      revenue: item.revenue,
      pointsAccumulated: item.pointsAccumulated,
      pointsRedeemed: item.pointsRedeemed,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
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
  const matchSell: Record<string, any> = { status: "completed" };
  if (startDate && endDate) {
    matchSell.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const matchCustomer: Record<string, any> = {};
  if (filters?.subscriptionStatus) matchCustomer["customer.subscription"] = filters.subscriptionStatus;
  if (filters?.customerName) matchCustomer["customer.firstName"] = { $regex: filters.customerName, $options: "i" };
  if (filters?.location) matchCustomer["customer.address"] = { $regex: filters.location, $options: "i" };

  const customerMatchStage: PipelineStage[] = Object.keys(matchCustomer).length ? [{ $match: matchCustomer }] : [];

  const skip = (page - 1) * limit;

  const recordsPipeline: PipelineStage[] = [
    { $match: matchSell },
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
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
  ];

  // ---------------- Safe skip/limit ----------------
  if (limit && limit > 0) {
    if (skip > 0) recordsPipeline.push({ $skip: skip });
    recordsPipeline.push({ $limit: limit });
  }

  const records = await Sell.aggregate(recordsPipeline);

  /* ---------------- Pagination ---------------- */
  const totalAgg = await Sell.aggregate([
    { $match: matchSell },
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
    { $unwind: "$customer" },
    ...customerMatchStage,
    { $group: { _id: "$userId" } },
    { $count: "total" },
  ]);

  const total = totalAgg[0]?.total ?? 0;

  /* ---------------- Monthly Aggregation ---------------- */
  const rawMonthly = await Sell.aggregate([
    { $match: matchSell },
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
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
        monthName: { $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }] },
        pointsAccumulated: 1,
        pointsRedeemed: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  // ---------------- Fill Missing Months ----------------
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
    pagination: { page, limit, total, totalPage: Math.ceil(total / (limit > 0 ? limit : total)) },
    data: { records, monthlyData: filledMonthlyData },
  };
};




const exportCustomerAnalytics = async (
  startDate?: string,
  endDate?: string,
  filters?: AnalyticsFilters
): Promise<Buffer> => {
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

  /* ---------------- Records ---------------- */
  const records = await Sell.aggregate([
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
        customerName: "$customer.firstName",
        location: "$customer.address",
        subscriptionStatus: "$customer.subscription",
        date: "$createdAt",
        pointsAccumulated: "$pointsEarned",
        pointsRedeemed: "$pointRedeemed",
      },
    },
    { $sort: { date: -1 } },
  ]);

  /* ---------------- Monthly Data ---------------- */
  const monthlyData = await Sell.aggregate([
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
        pointsAccumulated: { $sum: "$pointsEarned" },
        pointsRedeemed: { $sum: "$pointRedeemed" },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        pointsAccumulated: 1,
        pointsRedeemed: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  /* ---------------- Excel ---------------- */
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "The Pigeon Hub";
  workbook.created = new Date();

  /* ===== Sheet 1: Customer Records ===== */
  const recordSheet = workbook.addWorksheet("Customer Records");

  recordSheet.columns = [
    { header: "User ID", key: "userId", width: 28 },
    { header: "Customer Name", key: "customerName", width: 25 },
    { header: "Location", key: "location", width: 35 },
    { header: "Subscription", key: "subscriptionStatus", width: 15 },
    { header: "Date", key: "date", width: 20 },
    { header: "Points Earned", key: "pointsAccumulated", width: 18 },
    { header: "Points Redeemed", key: "pointsRedeemed", width: 18 },
  ];

  records.forEach((r) => {
    recordSheet.addRow({
      ...r,
      date: new Date(r.date).toLocaleString(),
    });
  });

  recordSheet.getRow(1).font = { bold: true };
  recordSheet.autoFilter = "A1:G1";

  /* ===== Sheet 2: Monthly Analytics ===== */
  const monthlySheet = workbook.addWorksheet("Monthly Analytics");

  monthlySheet.columns = [
    { header: "Year", key: "year", width: 10 },
    { header: "Month", key: "month", width: 10 },
    { header: "Points Earned", key: "pointsAccumulated", width: 20 },
    { header: "Points Redeemed", key: "pointsRedeemed", width: 20 },
  ];

  monthlyData.forEach((m) => {
    monthlySheet.addRow(m);
  });

  monthlySheet.getRow(1).font = { bold: true };
  monthlySheet.autoFilter = "A1:D1";

  /* ---------------- Buffer ---------------- */
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
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



const getMerchantAnalyticsMonthly = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters
) => {
  const matchSell: Record<string, any> = { status: "completed" };
  if (startDate && endDate) {
    matchSell.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const matchMerchant: Record<string, any> = {};
  if (filters?.subscriptionStatus) matchMerchant["merchant.subscription"] = filters.subscriptionStatus;
  if (filters?.merchantName) matchMerchant["merchant.firstName"] = { $regex: filters.merchantName, $options: "i" };
  if (filters?.location) matchMerchant["merchant.address"] = { $regex: filters.location, $options: "i" };

  const merchantMatchStage: PipelineStage[] = Object.keys(matchMerchant).length ? [{ $match: matchMerchant }] : [];

  const skip = (page - 1) * limit;

  const recordsPipeline: PipelineStage[] = [
    { $match: matchSell },
    { $lookup: { from: "users", localField: "merchantId", foreignField: "_id", as: "merchant" } },
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

  // ---------------- Apply safe skip/limit ----------------
  if (limit && limit > 0) {
    if (skip > 0) recordsPipeline.push({ $skip: skip });
    recordsPipeline.push({ $limit: limit });
  }

  const records = await Sell.aggregate(recordsPipeline);

  /* ---------------- Monthly Aggregation ---------------- */
  const rawMonthly = await Sell.aggregate([
    { $match: matchSell },
    { $lookup: { from: "users", localField: "merchantId", foreignField: "_id", as: "merchant" } },
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
        monthName: { $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }] },
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
      total: records.length,
      totalPage: Math.ceil(records.length / (limit > 0 ? limit : records.length)),
    },
    data: {
      records,
      monthlyData: filledMonthlyData,
    },
  };
};


const getPointRedeemedAnalytics = async (
  startDate?: string,
  endDate?: string
) => {
  const matchStage: Record<string, any> = {
    type: "REDEEM",
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};

    if (startDate) {
      matchStage.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      matchStage.createdAt.$lte = new Date(endDate);
    }
  }

  const result = await PointTransaction.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },

    { $unwind: "$user" },

    {
      $group: {
        _id: "$user._id",
        customerId: { $first: "$user.customUserId" },
        totalPointsRedeemed: { $sum: "$points" },
        redemptionCount: { $sum: 1 },
      },
    },

    {
      $project: {
        _id: 0,
        customerId: 1,
        totalPointsRedeemed: 1,
        redemptionCount: 1,
      },
    },
  ]);

  return result;
};

const getRevenuePerUser = async (
  startDate?: string,
  endDate?: string
) => {
  const matchStage: Record<string, any> = {
    price: { $gt: 0 },
    trxId: { $exists: true },
    status: { $ne: "cancel" },
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};

    if (startDate) {
      matchStage.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      matchStage.createdAt.$lte = new Date(endDate);
    }
  }

  const data = await Subscription.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    {
      $group: {
        _id: "$user._id",
        customUserId: { $first: "$user.customUserId" },
        totalTransactions: { $sum: 1 },
        totalRevenue: { $sum: "$price" },
      },
    },

    {
      $project: {
        _id: 0,
        customUserId: 1,
        totalTransactions: 1,
        totalRevenue: 1,
      },
    },

    { $sort: { totalRevenue: -1 } },
  ]);

  return {
    timeRange: {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    data,
  };
};


export const AnalyticsService = {
  getBusinessCustomerAnalytics,
  getMerchantAnalytics,
  getCustomerAnalytics,
  getMerchantAnalyticsExport,
  exportCustomerAnalytics,
  exportBusinessCustomerAnalytics,
  getMerchantAnalyticsMonthly,
  getPointRedeemedAnalytics,
  getRevenuePerUser
};
