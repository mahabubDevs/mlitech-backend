import mongoose, { PipelineStage } from "mongoose";
import { Sell } from "../mercent/mercentSellManagement/mercentSellManagement.model";
import { generateExcelBuffer } from "../../../helpers/excelExport";
import ExcelJS from "exceljs";
import PointTransaction from "../pointTransaction/pointTransaction.model";
import { Subscription } from "../subscription/subscription.model";
import { Response } from "express";
import { SalesRep } from "../salesRep/salesRep.model";
import { AnalyticsQueryOptions } from "./analytics.interface";
import { User } from "../user/user.model";

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
  city?: string;
  paymentStatus?: string;
}

const getBusinessCustomerAnalytics = async (
  merchantId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 10,
  filters?: AnalyticsFilters,
  role?: string,
  isSubMerchant?: boolean,
  mainMerchantId?: string
) => {
  console.log("====== Business Customer Analytics Called ======");
  console.log("Filters:", filters);

  const effectiveMerchantId =
    role === "VIEW_MERCENT" && isSubMerchant && mainMerchantId
      ? mainMerchantId
      : merchantId;

  /* ---------------- Base Match ---------------- */
  const matchSell: Record<string, any> = {
    merchantId: new mongoose.Types.ObjectId(effectiveMerchantId),
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

  if (filters?.paymentStatus) {
    matchCustomer["customer.paymentStatus"] = filters.paymentStatus;
  }

  if (filters?.customerName) {
    matchCustomer["customer.firstName"] = {
      $regex: filters.customerName,
      $options: "i",
    };
  }

  // 🔹 Location / City Filter (OR condition)
  if (filters?.location) {
    const locationRegex = new RegExp(filters.location, "i"); // case-insensitive
    matchCustomer["$or"] = [
      { "customer.city": locationRegex },
      { "customer.address": locationRegex },
    ];
  }

  console.log("Customer Match Stage:", matchCustomer);

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
        paymentStatus: "$customer.paymentStatus",
        location: "$customer.address",
        city: "$customer.city",
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

  console.log("Records found:", records.length, records.map(r => r.city));

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
    { $count: "total" },
  ]);

  const total = totalAgg[0]?.total ?? 0;
  console.log("Total Records:", total);

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
        totalUsers: { $sum: 1 },
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
        totalUsers: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  /* ---------------- Fill Missing Months ---------------- */
  const monthMap = new Map(
    rawMonthly.map((m: any) => [`${m.year}-${m.month}`, m])
  );

  const filledMonthlyData: any[] = [];
  if (startDate && endDate) {
    const cursor = new Date(startDate);
    const end = new Date(endDate);
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
        totalUsers: data?.totalUsers || 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  /* ---------------- ROLE BASED REVENUE HIDING ---------------- */
  const hideRevenueRoles = ["VIEW_MERCHANT", "VIEW_MERCENT"];
  if (hideRevenueRoles.includes(role as string)) {
    records.forEach((item) => delete item.revenue);
    filledMonthlyData.forEach((item) => delete item.totalRevenue);
  }

  console.log("====== Analytics Process Completed ======");
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

// const getMerchantAnalytics = async (
//   startDate?: string,
//   endDate?: string,
//   page: number = 1,
//   limit: number = 10,
//   filters?: AnalyticsFilters,
//   userRole?: string
// ) => {
//   const hideRevenue = userRole === "VIEW_ADMIN";

//   const matchSell: Record<string, any> = { status: "completed" };

//   if (startDate && endDate) {
//     matchSell.createdAt = {
//       $gte: new Date(startDate),
//       $lte: new Date(endDate),
//     };
//   }

//   if (filters?.paymentStatus) {
//     matchSell.paymentStatus = {
//       $regex: `^${filters.paymentStatus}$`,
//       $options: "i",
//     };
//   }

//   const skip = (page - 1) * limit;

//   const matchMerchant: Record<string, any> = {};
//   if (filters?.subscriptionStatus) {
//     matchMerchant["merchant.subscription"] = {
//       $regex: `^${filters.subscriptionStatus}$`,
//       $options: "i",
//     };
//   }
//   if (filters?.merchantName) {
//     matchMerchant["merchant.firstName"] = {
//       $regex: filters.merchantName,
//       $options: "i",
//     };
//   }
//   if (filters?.location) {
//     matchMerchant["merchant.address"] = {
//       $regex: filters.location,
//       $options: "i",
//     };
//   }
//   if (filters?.city) {
//     matchMerchant["merchant.city"] = {
//       $regex: filters.city,
//       $options: "i",
//     };
//   }

//   const merchantMatchStage: PipelineStage[] = Object.keys(matchMerchant).length
//     ? [{ $match: matchMerchant }]
//     : [];

//   const customerMatchStage: PipelineStage[] = filters?.customerName
//     ? [
//         {
//           $match: {
//             "customer.firstName": {
//               $regex: filters.customerName,
//               $options: "i",
//             },
//           },
//         },
//       ]
//     : [];

//   const recordsPipeline: PipelineStage[] = [
//     { $match: matchSell },
//     {
//       $lookup: {
//         from: "users",
//         localField: "merchantId",
//         foreignField: "_id",
//         as: "merchant",
//       },
//     },
//     { $unwind: "$merchant" },
//     {
//       $lookup: {
//         from: "users",
//         localField: "userId",
//         foreignField: "_id",
//         as: "customer",
//       },
//     },
//     { $unwind: "$customer" },
//     ...merchantMatchStage,
//     ...customerMatchStage,
//     // Count only users with role MERCHANT
//     {
//       $lookup: {
//         from: "users",
//         let: { merchantId: "$merchantId" },
//         pipeline: [
//           { $match: { $expr: { $eq: ["$_id", "$$merchantId"] }, role: "MERCHANT" } },
//         ],
//         as: "merchantUsers",
//       },
//     },
//     {
//       $group: {
//         _id: "$merchantId",
//         merchantName: { $first: "$merchant.firstName" },
//         location: { $first: "$merchant.address" },
//         subscriptionStatus: { $first: "$merchant.subscription" },
//         totalRevenue: { $sum: "$discountedBill" },
//         pointsRedeemed: { $sum: "$pointRedeemed" },
//         merchantUsers: { $first: "$merchantUsers" },
//         joiningDate: { $first: "$merchant.createdAt" },
//       },
//     },
//     {
//       $addFields: {
//         usersCount: { $size: "$merchantUsers" },
//       },
//     },
//     { $sort: { joiningDate: -1 } },
//     { $skip: skip },
//     { $limit: limit },
//   ];

//   let records = await Sell.aggregate(recordsPipeline);

//   if (hideRevenue) {
//     records = records.map((r) => ({
//       ...r,
//       totalRevenue: 0,
//     }));
//   }

//   const totalAgg = await Sell.aggregate([
//     { $match: matchSell },
//     {
//       $lookup: {
//         from: "users",
//         localField: "merchantId",
//         foreignField: "_id",
//         as: "merchant",
//       },
//     },
//     { $unwind: "$merchant" },
//     ...merchantMatchStage,
//     { $group: { _id: "$merchantId" } },
//     { $count: "total" },
//   ]);

//   const total = totalAgg[0]?.total ?? 0;

//   const rawMonthly = await Sell.aggregate([
//     { $match: matchSell },
//     {
//       $lookup: {
//         from: "users",
//         localField: "merchantId",
//         foreignField: "_id",
//         as: "merchant",
//       },
//     },
//     { $unwind: "$merchant" },
//     ...merchantMatchStage,
//     {
//       $group: {
//         _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
//         totalRevenue: { $sum: "$discountedBill" },
//         pointsRedeemed: { $sum: "$pointRedeemed" },
//         usersSet: { $addToSet: "$merchantId" },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         year: "$_id.year",
//         month: "$_id.month",
//         monthName: { $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }] },
//         totalRevenue: 1,
//         pointsRedeemed: 1,
//         usersCount: { $size: "$usersSet" },
//       },
//     },
//     { $sort: { year: 1, month: 1 } },
//   ]);

//   const monthMap = new Map(rawMonthly.map((m) => [`${m.year}-${m.month}`, m]));
//   const filledMonthlyData: any[] = [];
//   const cursor = new Date(startDate as string);
//   const end = new Date(endDate as string);
//   cursor.setDate(1);

//   while (cursor <= end) {
//     const year = cursor.getFullYear();
//     const month = cursor.getMonth() + 1;
//     const data = monthMap.get(`${year}-${month}`);
//     filledMonthlyData.push({
//       year,
//       month,
//       monthName: monthNames[month - 1],
//       totalRevenue: hideRevenue ? 0 : data?.totalRevenue || 0,
//       pointsRedeemed: data?.pointsRedeemed || 0,
//       usersCount: data?.usersCount || 0,
//     });
//     cursor.setMonth(cursor.getMonth() + 1);
//   }

//   return {
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPage: Math.ceil(total / limit),
//     },
//     data: {
//       records,
//       monthlyData: filledMonthlyData,
//     },
//   };
// };



const getMerchantAnalytics = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters,
  userRole: string = "SUPER_ADMIN"
) => {
  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  console.log("Service - Date range:", start, "to", end);

  // Match filter for merchants
  const merchantMatch: Record<string, any> = {
    createdAt: { $gte: start, $lte: end },
    role: "MERCENT" // Only merchants
  };

  if (filters?.subscriptionStatus) {
  merchantMatch.subscription = {
      $regex: `^${filters.subscriptionStatus}$`,
      $options: "i"
    };
  }
  if (filters?.paymentStatus) {
    merchantMatch.paymentStatus = {
      $regex: `^${filters.paymentStatus}$`,
      $options: "i"
    };
  }
  if (filters?.city) {
    merchantMatch.city = { $regex: filters.city, $options: "i" };
  }
  if (filters?.customerName) {
    merchantMatch.firstName = { $regex: filters.customerName, $options: "i" };
  }
  if (filters?.location) {
    merchantMatch.address = { $regex: filters.location, $options: "i" };
  }

  console.log("Service - MongoDB Match Filter (Merchants):", JSON.stringify(merchantMatch, null, 2));

  const skip = (page - 1) * limit;
  const hideSensitive = userRole === "VIEW_ADMIN";

  const lookupStages: PipelineStage[] = [
    { $lookup: { from: "subscriptions", localField: "_id", foreignField: "user", as: "subscriptions" } },
    { $lookup: { from: "sells", localField: "_id", foreignField: "userId", as: "sells" } },
  ];

  console.log("Service - Lookup Stages:", JSON.stringify(lookupStages, null, 2));

  // Records pipeline for merchants
  const recordsPipeline: PipelineStage[] = [
    { $match: merchantMatch },
    ...lookupStages,
    {
      $addFields: {
        pointsAccumulated: { $sum: "$subscriptions.points" },
        totalRevenue: { $sum: "$subscriptions.price" }
      }
    },
    {
      $project: {
        userId: "$_id",
        customUserId: 1,
        customerName: "$firstName",
        lastName: 1,
        email: 1,
        phone: 1,
        location: "$address",
        subscriptionStatus: "$subscription",
        paymentStatus: 1,
        subscriptions: 1,
        pointsAccumulated: 1,
        pointsRedeemed: hideSensitive ? { $literal: 0 } : "$redeem",
        totalRevenue: 1,
        date: "$createdAt"
      }
    },
    { $sort: { createdAt: -1 } }
  ];

  if (limit > 0) {
    if (skip > 0) recordsPipeline.push({ $skip: skip });
    recordsPipeline.push({ $limit: limit });
  }

  console.log("Service - Records Aggregation Pipeline (Merchants):", JSON.stringify(recordsPipeline, null, 2));

  // Monthly aggregation for merchants
  const monthlyPipeline: PipelineStage[] = [
    { $match: merchantMatch },
    ...lookupStages,
    { $unwind: { path: "$subscriptions", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        pointsAccumulated: { $sum: "$subscriptions.points" },
        pointsRedeemed: { $sum: "$sells.pointRedeemed" },
        totalRevenue: { $sum: "$subscriptions.price" }
      }
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        pointsAccumulated: { $sum: "$pointsAccumulated" },
        pointsRedeemed: { $sum: "$pointsRedeemed" },
        users: { $sum: 1 },
        revenue: { $sum: "$subscriptions.price" }
      }
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        monthName: { $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }] },
        pointsAccumulated: 1,
        pointsRedeemed: hideSensitive ? { $literal: 0 } : "$pointsRedeemed",
        users: 1,
        revenue: 1
      }
    }
  ];

  console.log("Service - Monthly Aggregation Pipeline (Merchants):", JSON.stringify(monthlyPipeline, null, 2));

  const [records, totalResult, monthlyDataRaw] = await Promise.all([
    User.aggregate(recordsPipeline),
    User.countDocuments(merchantMatch),
    User.aggregate(monthlyPipeline)
  ]);

  console.log("Service - Aggregation Results (Merchants):");
  console.log("Records:", records.length, "Total Count:", totalResult);
  console.log("Monthly Data Raw:", monthlyDataRaw);

  // Fill missing months
  const filledMonthlyData: any[] = [];
  const cursor = new Date(start);
  cursor.setDate(1);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const found = monthlyDataRaw.find((d) => d.year === year && d.month === month);

    filledMonthlyData.push({
      year,
      month,
      monthName: monthNames[month - 1],
      pointsAccumulated: found?.pointsAccumulated ?? 0,
      pointsRedeemed: found ? (hideSensitive ? 0 : found.pointsRedeemed) : 0,
      users: found?.users ?? 0,
      revenue: found?.revenue ?? 0
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  console.log("Service - Filled Monthly Data (Merchants):", filledMonthlyData);

  const totalPage = limit > 0 ? Math.ceil(totalResult / limit) : 1;

  return {
    pagination: { page, limit, total: totalResult, totalPage },
    data: { records, monthlyData: filledMonthlyData }
  };
};

interface AnalyticsFilters {
  subscriptionStatus?: string;
  customerName?: string;
  location?: string;
  paymentStatus?: string; // নতুন ফিল্ড
  city?: string; // নতুন ফিল্ড
}

// const getCustomerAnalytics = async (
//   startDate?: string,
//   endDate?: string,
//   page: number = 1,
//   limit: number = 10,
//   filters?: AnalyticsFilters,
//   userRole?: string
// ) => {
//   const hideSensitive = userRole === "VIEW_ADMIN";

//   const start = startDate ? new Date(startDate) : new Date("2000-01-01");
//   const end = endDate ? new Date(endDate) : new Date();
//   start.setDate(1);
//   end.setDate(1);

//   /* ---------------- Base Match for Sell ---------------- */
//   const matchSell: Record<string, any> = { status: "completed" };
//   if (startDate && endDate) {
//     matchSell.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
//   }

//   /* ---------------- Customer Filters ---------------- */
//   const matchCustomer: Record<string, any> = {};
//   if (filters?.subscriptionStatus) matchCustomer["customer.subscription"] = filters.subscriptionStatus;
//   if (filters?.customerName) matchCustomer["customer.firstName"] = { $regex: filters.customerName, $options: "i" };
//   if (filters?.location) matchCustomer["customer.address"] = { $regex: filters.location, $options: "i" };

//   // New paymentStatus filter
//   if (filters?.paymentStatus) matchCustomer["customer.paymentStatus"] = filters.paymentStatus;
//   // New city filter
//   if (filters?.city) matchCustomer["customer.city"] = { $regex: filters.city, $options: "i" };

//   const customerMatchStage: PipelineStage[] = Object.keys(matchCustomer).length ? [{ $match: matchCustomer }] : [];
//   const skip = (page - 1) * limit;

//   /* ---------------- Records Pipeline ---------------- */
//   const recordsPipeline: PipelineStage[] = [
//     { $match: matchSell },
//     { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
//     { $unwind: "$customer" },
//     ...customerMatchStage,
//     {
//       $project: {
//         _id: 0,
//         userId: "$customer._id",
//         customUserId: "$customer.customUserId",
//         customerName: "$customer.firstName",
//         location: "$customer.address",
//         subscriptionStatus: "$customer.subscription",
//         date: "$createdAt",
//         pointsAccumulated: "$pointsEarned",
//         pointsRedeemed: { $cond: [hideSensitive, 0, "$pointRedeemed"] },
//       },
//     },
//     { $sort: { date: -1 } },
//   ];

//   if (limit && limit > 0) {
//     if (skip > 0) recordsPipeline.push({ $skip: skip });
//     recordsPipeline.push({ $limit: limit });
//   }

//   const records = await Sell.aggregate(recordsPipeline);

//   /* ---------------- Pagination ---------------- */
//   const totalAgg = await Sell.aggregate([
//     { $match: matchSell },
//     { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
//     { $unwind: "$customer" },
//     ...customerMatchStage,
//     { $group: { _id: "$userId" } },
//     { $count: "total" },
//   ]);
//   const total = totalAgg[0]?.total ?? 0;

//   /* ---------------- Monthly Aggregations ---------------- */
//   const sellMonthly = await Sell.aggregate([
//     { $match: matchSell },
//     { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
//     { $unwind: "$customer" },
//     ...customerMatchStage,
//     {
//       $group: {
//         _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
//         pointsAccumulated: { $sum: "$pointsEarned" },
//         pointsRedeemed: { $sum: "$pointRedeemed" },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         year: "$_id.year",
//         month: "$_id.month",
//         monthName: { $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }] },
//         pointsAccumulated: 1,
//         pointsRedeemed: { $cond: [hideSensitive, 0, "$pointsRedeemed"] },
//       },
//     },
//   ]);

//   const userMonthly = await User.aggregate([
//     { $match: { createdAt: { $gte: start, $lte: end } } },
//     {
//       $group: {
//         _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
//         users: { $sum: 1 }, // নাম changed from signupCount -> users
//       },
//     },
//     { $project: { _id: 0, year: "$_id.year", month: "$_id.month", users: 1 } },
//   ]);

//   const subscriptionMonthly = await Subscription.aggregate([
//     { $match: { createdAt: { $gte: start, $lte: end }, status: "active" } },
//     {
//       $group: {
//         _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
//         revenue: { $sum: "$price" },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         year: "$_id.year",
//         month: "$_id.month",
//         revenue: { $cond: [hideSensitive, 0, "$revenue"] },
//       },
//     },
//   ]);

//   /* ---------------- Merge Monthly Data ---------------- */
//   const sellMap = new Map(sellMonthly.map(m => [`${m.year}-${m.month}`, m]));
//   const userMap = new Map(userMonthly.map(m => [`${m.year}-${m.month}`, m]));
//   const subscriptionMap = new Map(subscriptionMonthly.map(m => [`${m.year}-${m.month}`, m]));

//   const filledMonthlyData: any[] = [];
//   const cursor = new Date(start);

//   while (cursor <= end) {
//     const year = cursor.getFullYear();
//     const month = cursor.getMonth() + 1;
//     const key = `${year}-${month}`;

//     filledMonthlyData.push({
//       year,
//       month,
//       monthName: monthNames[month - 1],
//       pointsAccumulated: sellMap.get(key)?.pointsAccumulated || 0,
//       pointsRedeemed: sellMap.get(key)?.pointsRedeemed || 0,
//       users: userMap.get(key)?.users || 0, // changed field name
//       revenue: subscriptionMap.get(key)?.revenue || 0,
//     });

//     cursor.setMonth(cursor.getMonth() + 1);
//   }

//   return {
//     pagination: { page, limit, total, totalPage: Math.ceil(total / (limit > 0 ? limit : total)) },
//     data: { records, monthlyData: filledMonthlyData },
//   };
// };



const getCustomerAnalytics = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters,
  userRole: string = "MERCHANT"
) => {
  const hideSensitive = userRole === "VIEW_ADMIN";

  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // ── User Match Stage ─────────
  const userMatch: Record<string, any> = { createdAt: { $gte: start, $lte: end }, role: "USER" };

  if (filters?.subscriptionStatus) userMatch.subscription = filters.subscriptionStatus;
  if (filters?.paymentStatus) userMatch.paymentStatus = { $regex: `^${filters.paymentStatus}$`, $options: "i" };
  if (filters?.city) userMatch.city = { $regex: filters.city, $options: "i" };
  if (filters?.customerName) userMatch.firstName = { $regex: filters.customerName, $options: "i" };
  if (filters?.location) userMatch.address = { $regex: filters.location, $options: "i" };

  const skip = (page - 1) * limit;

  // ── Lookup Stages ─────────
  const lookupStages: PipelineStage[] = [
    { $lookup: { from: "subscriptions", localField: "_id", foreignField: "user", as: "subscriptions" } },
    { $lookup: { from: "sells", localField: "_id", foreignField: "userId", as: "sells" } },
  ];

  // ── Records Pipeline ─────────
  const recordsPipeline: PipelineStage[] = [
    { $match: userMatch },
    ...lookupStages,
    {
      $addFields: {
        pointsAccumulated: { $sum: "$subscriptions.points" },
        pointsRedeemed: { $sum: "$sells.pointRedeemed" },
        totalRevenue: { $sum: "$subscriptions.price" },
      },
    },
    {
      $project: {
        userId: "$_id",
        customUserId: 1,
        customerName: "$firstName",
        location: "$address",
        subscriptionStatus: "$subscription",
        paymentStatus: 1,
        date: "$createdAt",
        pointsAccumulated: 1,
        pointsRedeemed: hideSensitive ? { $literal: 0 } : "$pointsRedeemed",
        totalRevenue: 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ];

  if (limit > 0) {
    if (skip > 0) recordsPipeline.push({ $skip: skip });
    recordsPipeline.push({ $limit: limit });
  }

  // ── Monthly Pipeline (Subscription Aggregate) ─────────
  const monthlyPipeline: PipelineStage[] = [
    { $match: { createdAt: { $gte: start, $lte: end } } },
    ...(filters?.subscriptionStatus ? [{ $match: { status: filters.subscriptionStatus } }] : []),
    ...(filters?.paymentStatus ? [{ $match: { paymentStatus: filters.paymentStatus } }] : []),
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        revenue: { $sum: "$price" },
        pointsAccumulated: { $sum: "$points" },
        pointsRedeemed: { $sum: "$pointsRedeemed" },
        users: { $addToSet: "$user" },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        monthName: { $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }] },
        revenue: 1,
        pointsAccumulated: 1,
        pointsRedeemed: hideSensitive ? { $literal: 0 } : "$pointsRedeemed",
        users: { $size: "$users" },
      },
    },
  ];

  // ── Execute Pipelines ─────────
  const [records, totalResult, monthlyDataRaw] = await Promise.all([
    User.aggregate(recordsPipeline),
    User.countDocuments(userMatch),
    Subscription.aggregate(monthlyPipeline), // ✅ Subscription directly
  ]);

  // ── Fill missing months ─────────
  const filledMonthlyData: any[] = [];
  const cursor = new Date(start);
  cursor.setDate(1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const found = monthlyDataRaw.find((d) => d.year === year && d.month === month);

    filledMonthlyData.push({
      year,
      month,
      monthName: monthNames[month - 1],
      pointsAccumulated: found?.pointsAccumulated ?? 0,
      pointsRedeemed: found ? (hideSensitive ? 0 : found.pointsRedeemed) : 0,
      users: found?.users ?? 0,
      revenue: found?.revenue ?? 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totalPage = limit > 0 ? Math.ceil(totalResult / limit) : 1;

  return {
    pagination: { page, limit, total: totalResult, totalPage },
    data: { records, monthlyData: filledMonthlyData },
  };
};

const exportCustomerAnalytics = async (
  startDate?: string,
  endDate?: string,
  filters?: AnalyticsFilters
): Promise<Buffer> => {

  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();

  start.setHours(0,0,0,0);
  end.setHours(23,59,59,999);

  const userMatch: Record<string, any> = {
    createdAt: { $gte: start, $lte: end },
    role: "USER"
  };

  if (filters?.subscriptionStatus)
    userMatch.subscription = filters.subscriptionStatus;

  if (filters?.customerName)
    userMatch.firstName = { $regex: filters.customerName, $options: "i" };

  if (filters?.location)
    userMatch.address = { $regex: filters.location, $options: "i" };

  if (filters?.city)
    userMatch.city = { $regex: filters.city, $options: "i" };

  if (filters?.paymentStatus)
    userMatch.paymentStatus = {
      $regex: `^${filters.paymentStatus}$`,
      $options: "i",
    };

  /* ---------- Lookup ---------- */

  const lookupStages: PipelineStage[] = [
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "user",
        as: "subscriptions",
      },
    },
    {
      $lookup: {
        from: "sells",
        localField: "_id",
        foreignField: "userId",
        as: "sells",
      },
    },
  ];

  /* ---------- Records ---------- */

  const records = await User.aggregate([
    { $match: userMatch },

    ...lookupStages,

    {
      $addFields: {
        pointsAccumulated: { $sum: "$subscriptions.points" },
        pointsRedeemed: { $sum: "$sells.pointRedeemed" },
        totalRevenue: { $sum: "$subscriptions.price" },
      },
    },

    {
      $project: {
        _id: 0,
        userId: "$_id",
        customUserId: 1,
        customerName: "$firstName",
        location: "$address",
        city: 1,
        subscriptionStatus: "$subscription",
        paymentStatus: 1,
        date: "$createdAt",
        pointsAccumulated: 1,
        pointsRedeemed: 1,
        totalRevenue: 1,
      },
    },

    { $sort: { createdAt: -1 } },
  ]);

  /* ---------- Monthly Data ---------- */

  const monthlyData = await User.aggregate([
    { $match: userMatch },

    ...lookupStages,

    { $unwind: { path: "$subscriptions", preserveNullAndEmptyArrays: true } },

    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },

        users: { $sum: 1 },

        revenue: { $sum: "$subscriptions.price" },

        pointsAccumulated: { $sum: "$subscriptions.points" },

        pointsRedeemed: { $sum: "$sells.pointRedeemed" },
      },
    },

    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        users: 1,
        revenue: 1,
        pointsAccumulated: 1,
        pointsRedeemed: 1,
      },
    },

    { $sort: { year: 1, month: 1 } },
  ]);

  /* ---------- Excel ---------- */

  const workbook = new ExcelJS.Workbook();

  const recordSheet = workbook.addWorksheet("Customer Records");

  recordSheet.columns = [
    { header: "User ID", key: "userId", width: 28 },
    { header: "Custom ID", key: "customUserId", width: 18 },
    { header: "Customer Name", key: "customerName", width: 25 },
    { header: "Location", key: "location", width: 35 },
    { header: "City", key: "city", width: 18 },
    { header: "Subscription", key: "subscriptionStatus", width: 15 },
    { header: "Payment Status", key: "paymentStatus", width: 18 },
    { header: "Points Earned", key: "pointsAccumulated", width: 18 },
    { header: "Points Redeemed", key: "pointsRedeemed", width: 18 },
    { header: "Revenue", key: "totalRevenue", width: 18 },
    { header: "Date", key: "date", width: 20 },
  ];

  records.forEach((r) => {
    recordSheet.addRow({
      ...r,
      date: new Date(r.date).toLocaleString(),
    });
  });

  recordSheet.getRow(1).font = { bold: true };

  /* ---------- Monthly Sheet ---------- */

  const monthlySheet = workbook.addWorksheet("Monthly Analytics");

  monthlySheet.columns = [
    { header: "Year", key: "year", width: 10 },
    { header: "Month", key: "month", width: 10 },
    { header: "Users", key: "users", width: 12 },
    { header: "Revenue", key: "revenue", width: 18 },
    { header: "Points Earned", key: "pointsAccumulated", width: 20 },
    { header: "Points Redeemed", key: "pointsRedeemed", width: 20 },
  ];

  monthlyData.forEach((m) => {
    monthlySheet.addRow(m);
  });

  monthlySheet.getRow(1).font = { bold: true };

  /* ---------- Buffer ---------- */

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer as ArrayBuffer);
};


// service.ts
const getMerchantAnalyticsExport = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters,
  userRole: string = "SUPER_ADMIN"
) => {
  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const merchantMatch: Record<string, any> = {
    createdAt: { $gte: start, $lte: end },
    role: "MERCENT",
  };

    if (filters?.subscriptionStatus) {
    merchantMatch.subscription = {
        $regex: `^${filters.subscriptionStatus}$`,
        $options: "i"
      };
    }
    if (filters?.paymentStatus) {
      merchantMatch.paymentStatus = {
        $regex: `^${filters.paymentStatus}$`,
        $options: "i"
      };
    }
  if (filters?.city) {
    merchantMatch.city = { $regex: filters.city, $options: "i" };
  }
  if (filters?.customerName) {
    merchantMatch.firstName = { $regex: filters.customerName, $options: "i" };
  }
  if (filters?.location) {
    merchantMatch.address = { $regex: filters.location, $options: "i" };
  }

  const hideSensitive = userRole === "VIEW_ADMIN";

  const lookupStages: PipelineStage[] = [
    { $lookup: { from: "subscriptions", localField: "_id", foreignField: "user", as: "subscriptions" } },
    { $lookup: { from: "sells", localField: "_id", foreignField: "userId", as: "sells" } },
  ];

  const recordsPipeline: PipelineStage[] = [
    { $match: merchantMatch },
    ...lookupStages,
    {
      $addFields: {
        pointsAccumulated: { $sum: "$subscriptions.points" },
        totalRevenue: { $sum: "$subscriptions.price" }
      }
    },
    {
      $project: {
        userId: "$_id",
        customUserId: 1,
        customerName: "$firstName",
        lastName: 1,
        email: 1,
        phone: 1,
        location: "$address",
        subscriptionStatus: "$subscription",
        paymentStatus: 1,
        subscriptions: 1,
        pointsAccumulated: 1,
        pointsRedeemed: hideSensitive ? { $literal: 0 } : "$redeem",
        totalRevenue: 1,
        date: "$createdAt"
      }
    },
    { $sort: { createdAt: -1 } }
  ];

  if (limit > 0) {
    const skip = (page - 1) * limit;
    if (skip > 0) recordsPipeline.push({ $skip: skip });
    recordsPipeline.push({ $limit: limit });
  }

  const records = await User.aggregate(recordsPipeline);
  return { records };
};


const getMerchantAnalyticsMonthly = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters,
  userRole: string = "SUPER_ADMIN"
) => {
  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  console.log("Service Monthly - Date Range:", start, end);

  const merchantMatch: Record<string, any> = {
    createdAt: { $gte: start, $lte: end },
    role: "MERCENT",
  };

  if (filters?.subscriptionStatus) {
    merchantMatch.subscription = {
      $regex: filters.subscriptionStatus,
      $options: "i",
    };
  }

  if (filters?.paymentStatus) {
    merchantMatch.paymentStatus = {
      $regex: filters.paymentStatus,
      $options: "i",
    };
  }

  if (filters?.city) {
    merchantMatch.city = { $regex: filters.city, $options: "i" };
  }

  if (filters?.customerName) {
    merchantMatch.firstName = {
      $regex: filters.customerName,
      $options: "i",
    };
  }

  if (filters?.location) {
    merchantMatch.address = {
      $regex: filters.location,
      $options: "i",
    };
  }

  const hideSensitive = userRole === "VIEW_ADMIN";

  /* ---------------- Lookups ---------------- */

  const lookupStages: PipelineStage[] = [
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "user",
        as: "subscriptions",
      },
    },
    {
      $lookup: {
        from: "sells",
        localField: "_id",
        foreignField: "userId",
        as: "sells",
      },
    },
  ];

  /* ---------------- Monthly Aggregation ---------------- */

  const monthlyPipeline: PipelineStage[] = [
    { $match: merchantMatch },

    ...lookupStages,

    {
      $unwind: {
        path: "$subscriptions",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        pointsAccumulated: { $sum: "$subscriptions.points" },
        pointsRedeemed: { $sum: "$sells.pointRedeemed" },
        revenue: { $sum: "$subscriptions.price" },
      },
    },

    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },

        pointsAccumulated: { $sum: "$pointsAccumulated" },
        pointsRedeemed: { $sum: "$pointsRedeemed" },
        users: { $sum: 1 },
        revenue: { $sum: "$subscriptions.price" },
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
        pointsRedeemed: hideSensitive
          ? { $literal: 0 }
          : "$pointsRedeemed",
        usersCount: "$users",
        totalRevenue: "$revenue",
      },
    },

    { $sort: { year: 1, month: 1 } },
  ];

  const rawMonthly = await User.aggregate(monthlyPipeline);

  console.log("Service Monthly - Raw Data:", rawMonthly);

  /* ---------------- Fill Missing Months ---------------- */

  const monthMap = new Map(
    rawMonthly.map((m) => [`${m.year}-${m.month}`, m])
  );

  const filledMonthlyData: any[] = [];

  const cursor = new Date(start);
  cursor.setDate(1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    const found = monthMap.get(`${year}-${month}`);

    filledMonthlyData.push({
      year,
      month,
      monthName: monthNames[month - 1],
      totalRevenue: found?.totalRevenue ?? 0,
      pointsRedeemed: found
        ? hideSensitive
          ? 0
          : found.pointsRedeemed
        : 0,
      usersCount: found?.usersCount ?? 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  console.log("Service Monthly - Filled Data:", filledMonthlyData);

  return {
    pagination: {
      page,
      limit,
      total: filledMonthlyData.length,
      totalPage: 1,
    },
    data: {
      monthlyData: filledMonthlyData,
    },
  };
};


const getPointRedeemedAnalytics = async ({
  startDate,
  endDate,
  page = 1,
  limit = 10,
  forExport = false,
}: AnalyticsQueryOptions) => {
  const matchStage: Record<string, any> = {
    type: "REDEEM",
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  // Base aggregation
  const aggregationPipeline: any[] = [
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
        customerName: { $first: "$user.firstName" },
        totalPointsRedeemed: { $sum: "$points" },
        redemptionCount: { $sum: 1 },
      },
    },

    {
      $project: {
        _id: 0,
        customerId: 1,
        customerName: 1,
        totalPointsRedeemed: 1,
        redemptionCount: 1,
      },
    },

    { $sort: { totalPointsRedeemed: -1 } },
  ];

  let totalCount: number | undefined;

  // Pagination only if not exporting
  if (!forExport) {
    const totalCountAgg = await PointTransaction.aggregate([
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
      { $group: { _id: "$user._id" } },
      { $count: "total" },
    ]);
    totalCount = totalCountAgg[0]?.total || 0;

    const skip = (page - 1) * limit;
    aggregationPipeline.push({ $skip: skip }, { $limit: limit });
  }

  const result = await PointTransaction.aggregate(aggregationPipeline);

  const pagination = !forExport && totalCount !== undefined
    ? {
      total: totalCount,
      limit,
      page,
      totalPage: Math.ceil(totalCount / limit),
    }
    : undefined;

  return {
    timeRange: {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    data: result,
    pagination,
  };
};

const exportPointRedeemedAnalytics = async (res: Response, startDate?: string, endDate?: string) => {
  const { data } = await getPointRedeemedAnalytics({ startDate, endDate, forExport: true });

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const sheet = workbook.addWorksheet("Point Redeemed");

  sheet.columns = [
    { header: "Customer ID", key: "customerId", width: 25 },
    { header: "Customer Name", key: "customerName", width: 25 },
    { header: "Total Points Redeemed", key: "totalPointsRedeemed", width: 20 },
    { header: "Redemption Count", key: "redemptionCount", width: 20 },
  ];

  data.forEach(row => sheet.addRow(row));

  sheet.addRow({}).commit();
  sheet.addRow({
    customUserId: "TOTAL",
    totalPointsRedeemed: data.reduce((a, b) => a + b.totalPointsRedeemed, 0),
    redemptionCount: data.reduce((a, b) => a + b.redemptionCount, 0),
  }).commit();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=point-redeemed.xlsx"
  );

  await sheet.commit();
  await workbook.commit();
};



const getRevenuePerUser = async ({
  startDate,
  endDate,
  page = 1,
  limit = 10,
  forExport = false,
}: AnalyticsQueryOptions) => {
  const matchStage: Record<string, any> = {
    price: { $gt: 0 },
    trxId: { $exists: true },
    status: { $ne: "cancel" },
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  // Build aggregation pipeline
  const aggregationPipeline: any[] = [
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
        customerName: { $first: "$user.firstName" },
        totalTransactions: { $sum: 1 },
        totalRevenue: { $sum: "$price" },
        firstTransaction: { $min: "$createdAt" },
        lastTransaction: { $max: "$createdAt" },
      },
    },

    {
      $project: {
        _id: 0,
        customerId: 1,
        customerName: 1,
        totalTransactions: 1,
        totalRevenue: 1,
        firstTransaction: 1,
        lastTransaction: 1,
      },
    },

    { $sort: { totalRevenue: -1 } },
  ];

  let totalCount: number | undefined;

  // Apply pagination only if not exporting
  if (!forExport) {
    // Count unique users after grouping
    const totalCountAgg = await Subscription.aggregate([
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
      { $group: { _id: "$user._id" } },
      { $count: "total" },
    ]);
    totalCount = totalCountAgg[0]?.total || 0;

    const skip = (page - 1) * limit;
    aggregationPipeline.push({ $skip: skip }, { $limit: limit });
  }

  const data = await Subscription.aggregate(aggregationPipeline);

  const pagination = !forExport && totalCount !== undefined
    ? {
      total: totalCount,
      limit,
      page,
      totalPage: Math.ceil(totalCount / limit),
    }
    : undefined;

  return {
    timeRange: {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    data,
    pagination,
  };
};



const exportRevenuePerUser = async (
  res: Response,
  startDate?: string,
  endDate?: string
) => {
  const { data } = await getRevenuePerUser({ startDate, endDate, forExport: true });

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const sheet = workbook.addWorksheet("Customer Revenue");

  sheet.columns = [
    { header: "Customer ID", key: "customerId", width: 25 },
    { header: "Customer Name", key: "customerName", width: 25 },
    { header: "Total Transactions", key: "totalTransactions", width: 20 },
    { header: "Total Revenue", key: "totalRevenue", width: 20 },
    // { header: "First Transaction", key: "firstTransaction", width: 25 },
    // { header: "Last Transaction", key: "lastTransaction", width: 25 },
  ];

  data.forEach(row => sheet.addRow({
    ...row,
    firstTransaction: row.firstTransaction.toISOString(),
    lastTransaction: row.lastTransaction.toISOString(),
  }).commit());

  sheet.addRow({}).commit();
  sheet.addRow({
    customUserId: "TOTAL",
    totalTransactions: data.reduce((a, b) => a + b.totalTransactions, 0),
    totalRevenue: data.reduce((a, b) => a + b.totalRevenue, 0),
  }).commit();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=customer-revenue.xlsx"
  );

  await sheet.commit();
  await workbook.commit();
};

const getCashCollectionAnalytics = async ({
  startDate,
  endDate,
  page = 1,
  limit = 10,
  forExport = false,
}: AnalyticsQueryOptions) => {
  const matchStage: Record<string, any> = {
    paymentStatus: "paid",
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const aggregationPipeline: any[] = [
    { $match: matchStage },

    {
      $lookup: {
        from: "users",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },

    {
      $group: {
        _id: "$customer._id",
        customerId: { $first: "$customer.customUserId" },
        salesRep: { $first: "$salesRepName" },
        totalTransactions: { $sum: 1 },
        totalReceived: { $sum: "$price" },
      },
    },

    {
      $project: {
        _id: 0,
        customerId: 1,
        salesRep: 1,
        totalTransactions: 1,
        totalReceived: 1,
      },
    },

    { $sort: { totalReceived: -1 } },
  ];

  let totalCount: number | undefined;

  if (!forExport) {
    // Count unique customers after grouping
    const totalCountAgg = await SalesRep.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      { $group: { _id: "$customer._id" } },
      { $count: "total" },
    ]);
    totalCount = totalCountAgg[0]?.total || 0;

    const skip = (page - 1) * limit;
    aggregationPipeline.push({ $skip: skip }, { $limit: limit });
  }

  const data = await SalesRep.aggregate(aggregationPipeline);

  const pagination = !forExport && totalCount !== undefined
    ? {
      total: totalCount,
      limit,
      page,
      totalPage: Math.ceil(totalCount / limit),
    }
    : undefined;

  return {
    timeRange: {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    data,
    pagination,
  };
};


const exportCashCollectionAnalytics = async (
  res: Response,
  startDate?: string,
  endDate?: string
) => {
  const { data } = await getCashCollectionAnalytics({ startDate, endDate, forExport: true });


  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const sheet = workbook.addWorksheet("Cash Collection");

  sheet.columns = [
    { header: "Customer ID", key: "customerId", width: 25 },
    { header: "Sales Rep", key: "salesRep", width: 25 },
    { header: "Total Transactions", key: "totalTransactions", width: 22 },
    { header: "Total Received", key: "totalReceived", width: 20 },
  ];

  data.forEach(row => sheet.addRow(row));

  // Summary row
  sheet.addRow({});
  sheet.addRow({
    customUserId: "TOTAL",
    totalTransactions: data.reduce(
      (sum, row) => sum + row.totalTransactions,
      0
    ),
    totalReceived: data.reduce(
      (sum, row) => sum + row.totalReceived,
      0
    ),
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=cash-collection.xlsx"
  );

  await sheet.commit();
  await workbook.commit();
};


const getCashReceivableAnalytics = async ({
  startDate,
  endDate,
  page = 1,
  limit = 10,
  forExport = false,
}: AnalyticsQueryOptions) => {
  const matchStage: Record<string, any> = {
    paymentStatus: "unpaid",
    acknowledged: true,
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const aggregationPipeline: any[] = [
    { $match: matchStage },

    {
      $lookup: {
        from: "users",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },

    {
      $group: {
        _id: "$customer._id",
        customerId: { $first: "$customer.customUserId" },
        location: { $first: "$customer.address" },
        salesRep: { $first: "$salesRepName" },
        totalTransactions: { $sum: 1 },
        totalOutstanding: { $sum: "$price" },
      },
    },
    

    {
      $project: {
        _id: 0,
        customerId: 1,
        location: 1,
        salesRep: 1,
        totalTransactions: 1,
        totalOutstanding: 1,
      },
    },

     { $sort: { totalReceived: -1 } }, 
  ];

  let totalCount: number | undefined;

  if (!forExport) {
    // Count unique customers after grouping
    const totalCountAgg = await SalesRep.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      { $group: { _id: "$customer._id" } },
      { $count: "total" },
    ]);
    totalCount = totalCountAgg[0]?.total || 0;

    const skip = (page - 1) * limit;
    aggregationPipeline.push({ $skip: skip }, { $limit: limit });
  }

  const data = await SalesRep.aggregate(aggregationPipeline);

  const pagination = !forExport && totalCount !== undefined
    ? {
      total: totalCount,
      limit,
      page,
      totalPage: Math.ceil(totalCount / limit),
    }
    : undefined;

  return {
    timeRange: {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    data,
    pagination,
  };
};

const exportCashReceivableAnalytics = async (
  res: Response,
  startDate?: string,
  endDate?: string
) => {
  // headers first
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=cash-receivable.xlsx"
  );

  const { data } = await getCashReceivableAnalytics({
    startDate,
    endDate,
    forExport: true,
  });

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const sheet = workbook.addWorksheet("Cash Receivable");

  /* ---------- DATE RANGE (FIRST ROWS) ---------- */
  /* ---------- DATE RANGE (MERGED CELL) ---------- */
  if (startDate || endDate) {
    const text = `Date Range: ${startDate ? new Date(startDate).toDateString() : "All"
      } → ${endDate ? new Date(endDate).toDateString() : "All"
      }`;

    const row = sheet.addRow([text]);

    // 🔑 MERGE BEFORE COMMIT
    sheet.mergeCells(`A${row.number}:E${row.number}`);

    row.font = { bold: true };
    row.alignment = { horizontal: "center" };

    row.commit();
    sheet.addRow([]).commit();
  }


  /* ---------- DEFINE COLUMNS (NO AUTO HEADER) ---------- */
  sheet.columns = [
    { key: "customerId", width: 25 },
    { key: "location", width: 25 },
    { key: "salesRep", width: 25 },
    { key: "totalTransactions", width: 22 },
    { key: "totalOutstanding", width: 20 },
  ];

  /* ---------- MANUAL HEADER ROW ---------- */
  sheet.addRow([
    "Customer ID",
    "Location",
    "Sales Rep",
    "Total Transactions",
    "Total Outstanding",
  ]).commit();

  /* ---------- DATA ---------- */
  data.forEach(row => {
    sheet.addRow(row).commit();
  });

  /* ---------- SUMMARY ---------- */
  sheet.addRow([]).commit();
  sheet.addRow({
    customerId: "TOTAL",
    totalTransactions: data.reduce((s, r) => s + r.totalTransactions, 0),
    totalOutstanding: data.reduce((s, r) => s + r.totalOutstanding, 0),
  }).commit();

  await workbook.commit();
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
  exportPointRedeemedAnalytics,
  getRevenuePerUser,
  exportRevenuePerUser,
  getCashCollectionAnalytics,
  exportCashCollectionAnalytics,
  getCashReceivableAnalytics,
  exportCashReceivableAnalytics
};
