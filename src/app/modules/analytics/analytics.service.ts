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
import { sub } from "date-fns/sub";

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
  console.log("\n==============================");
  console.log("🚀 ANALYTICS API STARTED");
  console.log("==============================");

  console.log("👉 Merchant ID:", merchantId);
  console.log("👉 Role:", role);
  console.log("👉 Is SubMerchant:", isSubMerchant);
  console.log("👉 Main Merchant ID:", mainMerchantId);

  console.log("👉 Date Range:", { startDate, endDate });
  console.log("👉 Page / Limit:", { page, limit });

  console.log("👉 Filters Received:", filters);

  const effectiveMerchantId =
    role === "VIEW_MERCENT" && isSubMerchant && mainMerchantId
      ? mainMerchantId
      : merchantId;

  console.log("🔥 Effective Merchant ID:", effectiveMerchantId);

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

  console.log("📦 matchSell:", JSON.stringify(matchSell, null, 2));

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

  /* ---------------- City Filter ---------------- */
 const cityValue = filters?.location; // 👈 frontend থেকে আসছে location

if (cityValue) {
  const city = cityValue.trim();
  const cityRegex = new RegExp(city, "i");

  matchCustomer["customer.city"] = {
    $regex: cityRegex,
  };

  console.log("🏙️ City Filter Applied (from location):", city);
}

  console.log("👤 matchCustomer:", JSON.stringify(matchCustomer, null, 2));

  const customerMatchStage: PipelineStage[] = Object.keys(matchCustomer).length
    ? [{ $match: matchCustomer }]
    : [];

  console.log("🧩 customerMatchStage:", customerMatchStage);

  const skip = (page - 1) * limit;

  console.log("📌 Skip Value:", skip);

  /* =====================================================
     🔥 BASE PIPELINE
  ===================================================== */
  const basePipeline: PipelineStage[] = [
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
  ];

  console.log("⚙️ Base Pipeline Ready");

  /* ---------------- Records ---------------- */
  const recordsPipeline: PipelineStage[] = [
    ...basePipeline,
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

  console.log("📊 Records Pipeline Ready");

  const records = await Sell.aggregate(recordsPipeline);

  console.log("✅ Records Found:", records.length);
  console.log("📄 Sample Record:", records[0] || "No Data");

  /* ---------------- Pagination Count ---------------- */
  const totalAgg = await Sell.aggregate([
    ...basePipeline,
    { $count: "total" },
  ]);

  const total = totalAgg[0]?.total ?? 0;

  console.log("📦 Total Count:", total);

  /* ---------------- Monthly Aggregation ---------------- */
  const rawMonthly = await Sell.aggregate([
    ...basePipeline,
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

  console.log("📈 Raw Monthly Data:", rawMonthly);

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

  console.log("📊 Filled Monthly Data:", filledMonthlyData);

  /* ---------------- Role Based Revenue Hiding ---------------- */
  const hideRevenueRoles = ["VIEW_MERCHANT", "VIEW_MERCENT"];

  if (hideRevenueRoles.includes(role as string)) {
    records.forEach((item) => delete item.revenue);
    filledMonthlyData.forEach((item) => delete item.totalRevenue);

    console.log("🔒 Revenue Hidden for Role:", role);
  }

  console.log("\n==============================");
  console.log("✅ ANALYTICS API COMPLETED");
  console.log("==============================\n");

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
  const hideSensitive = userRole === "VIEW_ADMIN";

  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const merchantMatch: Record<string, any> = {
    createdAt: { $gte: start, $lte: end },
    role: "MERCENT",
  };

  if (filters?.paymentStatus) {
    merchantMatch.paymentStatus = filters.paymentStatus;
  }

  if (filters?.customerName) {
    merchantMatch.firstName = {
      $regex: filters.customerName,
      $options: "i",
    };
  }

  // ✅ FIX: ONLY ONE CITY FILTER (location → city)
  if (filters?.location) {
    merchantMatch.city = {
      $regex: filters.location.trim(),
      $options: "i",
    };
  }

  if (filters?.subscriptionStatus) {
    merchantMatch.subscription = filters.subscriptionStatus;
  }

  const skip = (page - 1) * limit;

  // ===================== RECORDS PIPELINE =====================
  const recordsPipeline: PipelineStage[] = [
    { $match: merchantMatch },

    {
      $lookup: {
        from: "sells",
        let: { merchantId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$merchantId", "$$merchantId"] },
                  { $eq: ["$status", "completed"] },
                ],
              },
            },
          },
        ],
        as: "sells",
      },
    },

    {
      $addFields: {
        totalRevenue: {
          $sum: {
            $map: {
              input: "$sells",
              as: "s",
              in: "$$s.totalBill",
            },
          },
        },

        pointsRedeemed: {
          $sum: {
            $map: {
              input: "$sells",
              as: "s",
              in: "$$s.pointRedeemed",
            },
          },
        },

        pointsEarned: {
          $sum: {
            $map: {
              input: "$sells",
              as: "s",
              in: "$$s.pointsEarned",
            },
          },
        },

        visit: { $size: "$sells" },
      },
    },

    {
      $project: {
        merchantId: "$_id",
        merchantName: "$firstName",
        subscriptionStatus: "$subscription",
        location: "$address",
        businessName: 1,
        customUserId: 1,
        email: 1,
        phone: 1,
        city: 1,
        paymentStatus: 1,

        totalRevenue: {
          $cond: {
            if: { $eq: [hideSensitive, true] },
            then: 0,
            else: "$totalRevenue",
          },
        },

        pointsEarned: 1,
        pointsRedeemed: 1,
        visit: 1,
        date: "$createdAt",
      },
    },

    { $sort: { totalRevenue: -1 } },
  ];

  if (limit > 0) {
    if (skip > 0) recordsPipeline.push({ $skip: skip });
    recordsPipeline.push({ $limit: limit });
  }

  // ===================== MONTHLY PIPELINE =====================
  const monthlyPipeline: PipelineStage[] = [
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: "completed",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "merchantId",
        foreignField: "_id",
        as: "user",
      },
    },

    { $unwind: "$user" },

    // ✅ FIX: SINGLE CLEAN FILTER BLOCK
    {
      $match: {
        ...(filters?.paymentStatus && {
          "user.paymentStatus": filters.paymentStatus,
        }),

        ...(filters?.subscriptionStatus && {
          "user.subscription": filters.subscriptionStatus,
        }),

        ...(filters?.location && {
          "user.city": {
            $regex: filters.location.trim(),
            $options: "i",
          },
        }),

        ...(filters?.customerName && {
          $or: [
            {
              "user.firstName": {
                $regex: filters.customerName,
                $options: "i",
              },
            },
            {
              "user.businessName": {
                $regex: filters.customerName,
                $options: "i",
              },
            },
          ],
        }),
      },
    },

    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalRevenue: { $sum: "$totalBill" },
        pointsRedeemed: { $sum: "$pointRedeemed" },
        pointsEarned: { $sum: "$pointsEarned" },
        users: { $sum: 1 },
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

        totalRevenue: {
          $cond: {
            if: { $eq: [hideSensitive, true] },
            then: 0,
            else: "$totalRevenue",
          },
        },

        pointsEarned: 1,
        pointsRedeemed: 1,
        users: 1,
      },
    },
  ];

  // ===================== EXECUTION =====================
  const [records, totalResult, monthlyDataRaw] = await Promise.all([
    User.aggregate(recordsPipeline),
    User.countDocuments(merchantMatch),
    Sell.aggregate(monthlyPipeline),
  ]);

  const total = totalResult || 0;

  // ===================== FILL MONTHS =====================
  const filledMonthlyData: any[] = [];
  const cursor = new Date(start);
  cursor.setDate(1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    const found = monthlyDataRaw.find(
      (d) => d.year === year && d.month === month
    );

    filledMonthlyData.push({
      year,
      month,
      monthName: monthNames[month - 1],
      totalRevenue: hideSensitive ? 0 : found?.totalRevenue ?? 0,
      pointsEarned: found?.pointsEarned ?? 0,
      pointsRedeemed: found?.pointsRedeemed ?? 0,
      users: found?.users ?? 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  // ===================== RESPONSE =====================
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

  console.log("\n==============================");
  console.log("🚀 CUSTOMER ANALYTICS STARTED (FINAL CLEAN FIX)");
  console.log("==============================");

  const hideSensitive = userRole === "VIEW_ADMIN";

  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const skip = (page - 1) * limit;

  /* ================= BASE MATCH ================= */
  const baseMatch: any = {
    status: "completed",
    createdAt: { $gte: start, $lte: end },
  };

  /* =====================================================
     🔥 MAIN PIPELINE (RECORDS)
  ===================================================== */
  const basePipeline: PipelineStage[] = [
    { $match: baseMatch },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },

    { $unwind: "$user" },

    /* ================= FILTERS ================= */
    {
      $match: {
        ...(filters?.paymentStatus && {
          "user.paymentStatus": {
            $regex: `^${filters.paymentStatus}$`,
            $options: "i",
          },
        }),

        ...(filters?.subscriptionStatus && {
          "user.subscription": filters.subscriptionStatus,
        }),

        ...(filters?.city && {
          "user.city": {
            $regex: `^${filters.city.trim()}$`,
            $options: "i",
          },
        }),

        ...(filters?.customerName && {
          "user.firstName": {
            $regex: `^${filters.customerName.trim()}$`,
            $options: "i",
          },
        }),

        ...(filters?.location && {
          "user.address": {
            $regex: filters.location,
            $options: "i",
          },
        }),
      },
    },

    /* ================= GROUP ================= */
    {
      $group: {
        _id: "$user._id",

        customUserId: { $first: "$user.customUserId" },
        customerName: { $first: "$user.firstName" },
        location: { $first: "$user.address" },
        subscriptionStatus: { $first: "$user.subscription" },
        paymentStatus: { $first: "$user.paymentStatus" },

        pointsEarned: { $sum: "$pointsEarned" },
        pointsRedeemed: { $sum: "$pointRedeemed" },
        totalRevenue: { $sum: "$totalBill" },

        visits: { $sum: 1 },
      },
    },

    /* ================= SAFE MASKING (REVENUE) ================= */
    {
      $addFields: {
        totalRevenueSafe: hideSensitive ? 0 : "$totalRevenue",
      },
    },

    /* ================= FINAL SHAPE ================= */
    {
      $project: {
        userId: "$_id",
        customUserId: 1,
        customerName: 1,
        location: 1,
        subscriptionStatus: 1,
        paymentStatus: 1,

        pointsEarned: 1,
        pointsRedeemed: 1,

        totalRevenue: "$totalRevenueSafe",
        visit: "$visits",
      },
    },

    { $sort: { totalRevenue: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  /* =====================================================
     🔥 COUNT PIPELINE
  ===================================================== */
  const countPipeline: PipelineStage[] = [
    { $match: baseMatch },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },

    { $unwind: "$user" },

    {
      $match: {
        ...(filters?.city && {
          "user.city": {
            $regex: `^${filters.city.trim()}$`,
            $options: "i",
          },
        }),

        ...(filters?.customerName && {
          "user.firstName": {
            $regex: `^${filters.customerName.trim()}$`,
            $options: "i",
          },
        }),
      },
    },

    { $group: { _id: "$user._id" } },
    { $count: "total" },
  ];

/* =====================================================
     🔥 MONTHLY PIPELINE
  ===================================================== */
const monthlyPipeline: PipelineStage[] = [
  { $match: baseMatch },

  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },

  { $unwind: "$user" },

  /* ================= FIX: SAME FILTER LOGIC AS BASE ================= */
  {
    $match: {
      ...(filters?.paymentStatus && {
        "user.paymentStatus": {
          $regex: `^${filters.paymentStatus}$`,
          $options: "i",
        },
      }),

      ...(filters?.subscriptionStatus && {
        "user.subscription": filters.subscriptionStatus,
      }),

      ...(filters?.city && {
        "user.city": {
          $regex: `^${filters.city.trim()}$`,
          $options: "i",
        },
      }),

      ...(filters?.customerName && {
        "user.firstName": {
          $regex: `^${filters.customerName.trim()}$`,
          $options: "i",
        },
      }),

      ...(filters?.location && {
        "user.address": {
          $regex: filters.location,
          $options: "i",
        },
      }),
    },
  },

  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      },

      totalRevenue: { $sum: "$totalBill" },
      pointsEarned: { $sum: "$pointsEarned" },
      pointsRedeemed: { $sum: "$pointRedeemed" },
      users: { $sum: 1 },
    },
  },

  /* ================= SAFE MASKING ================= */
  {
    $addFields: {
      totalRevenueSafe: hideSensitive ? 0 : "$totalRevenue",
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

      totalRevenue: "$totalRevenueSafe",
      pointsEarned: 1,
      pointsRedeemed: 1,
      users: 1,
    },
  },
];

  /* =====================================================
     🔥 EXECUTE ALL
  ===================================================== */
  const [records, countResult, monthlyRaw] = await Promise.all([
    Sell.aggregate(basePipeline),
    Sell.aggregate(countPipeline),
    Sell.aggregate(monthlyPipeline),
  ]);

  const total = countResult[0]?.total || 0;

  /* =====================================================
     🔥 FILL MONTHS
  ===================================================== */
  const filledMonthly: any[] = [];
  const cursor = new Date(start);
  cursor.setDate(1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    const found = monthlyRaw.find(
      (m) => m.year === year && m.month === month
    );

    filledMonthly.push({
      year,
      month,
      monthName: monthNames[month - 1],
      totalRevenue: found?.totalRevenue || 0,
      pointsEarned: found?.pointsEarned || 0,
      pointsRedeemed: found?.pointsRedeemed || 0,
      users: found?.users || 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totalPage = Math.ceil(total / limit);

  console.log("📊 Total Records:", total);
  console.log("📄 Records Returned:", records.length);
  console.log("==============================");
  console.log("🏁 CUSTOMER ANALYTICS COMPLETED");
  console.log("==============================");

  return {
    pagination: {
      page,
      limit,
      total,
      totalPage,
    },
    data: {
      records,
      monthlyData: filledMonthly,
    },
  };
};

// getCustomerMonthlyReport function to fetch monthly aggregated data for customers with applied filters and role-based data hiding

const getCustomerMonthlyReport = async (
  startDate?: string,
  endDate?: string,
  filters?: AnalyticsFilters,
  userRole: string = "MERCHANT"
) => {
  const hideSensitive = userRole === "VIEW_ADMIN";

  // ✅ Set date range
  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // ── Build match filters for sells/users
  const match: Record<string, any> = {
    createdAt: { $gte: start, $lte: end },
    status: "completed",
  };

  if (filters?.paymentStatus) match.paymentStatus = { $regex: filters.paymentStatus, $options: "i" };
  if (filters?.subscriptionStatus) match["user.subscription"] = filters.subscriptionStatus;
  if (filters?.customerName) match["user.firstName"] = { $regex: filters.customerName, $options: "i" };
  if (filters?.location) match["user.address"] = { $regex: filters.location, $options: "i" };
  if (filters?.city) match["user.city"] = { $regex: filters.city, $options: "i" };

  // ── Aggregate monthly data
  const monthlyPipeline: PipelineStage[] = [
    // Join users
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: match },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        totalRevenue: { $sum: "$totalBill" },
        pointsRedeemed: { $sum: "$pointRedeemed" },
        pointsEarned: { $sum: "$pointsEarned" },
        users: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        monthName: { $arrayElemAt: [monthNames, { $subtract: ["$_id.month", 1] }] },
        totalRevenue: 1,
        pointsRedeemed: hideSensitive ? { $literal: 0 } : "$pointsRedeemed",
        pointsEarned: 1,
        users: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ];

  const rawMonthly = await Sell.aggregate(monthlyPipeline);

  // ── Fill missing months
  const monthMap = new Map(rawMonthly.map((m) => [`${m.year}-${m.month}`, m]));
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
      pointsEarned: found?.pointsEarned ?? 0,
      pointsRedeemed: found ? (hideSensitive ? 0 : found.pointsRedeemed) : 0,
      users: found?.users ?? 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { monthlyData: filledMonthlyData };
};


const exportCustomerAnalytics = async (
  startDate?: string,
  endDate?: string,
  filters?: AnalyticsFilters,
  userRole: string = "MERCHANT"
): Promise<Buffer> => {

  const hideSensitive = userRole === "VIEW_ADMIN";

  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  console.log("🚀 EXPORT START:", { start, end, filters });

  /* ================= BASE MATCH ================= */
  const baseMatch: any = {
    status: "completed",
    createdAt: { $gte: start, $lte: end },
  };

  /* ================= MAIN PIPELINE (FIXED) ================= */
  const pipeline: PipelineStage[] = [
    { $match: baseMatch },

    /* 🔥 START FROM USERS (IMPORTANT FIX) */
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },

    { $unwind: "$user" },

    /* ================= FILTERS (SAME AS ANALYTICS) ================= */
    {
      $match: {
        ...(filters?.paymentStatus && {
          "user.paymentStatus": {
            $regex: `^${filters.paymentStatus}$`,
            $options: "i",
          },
        }),

        ...(filters?.subscriptionStatus && {
          "user.subscription": filters.subscriptionStatus,
        }),

        ...(filters?.city && {
          "user.city": {
            $regex: filters.city,
            $options: "i",
          },
        }),

        ...(filters?.location && {
          "user.address": {
            $regex: filters.location,
            $options: "i",
          },
        }),

        ...(filters?.customerName && {
          $or: [
            {
              "user.firstName": {
                $regex: filters.customerName,
                $options: "i",
              },
            },
            {
              "user.businessName": {
                $regex: filters.customerName,
                $options: "i",
              },
            },
          ],
        }),
      },
    },

    /* ================= GROUP ================= */
    {
      $group: {
        _id: "$user._id",

        customUserId: { $first: "$user.customUserId" },
        customerName: { $first: "$user.firstName" },
        location: { $first: "$user.address" },
        city: { $first: "$user.city" },
        subscriptionStatus: { $first: "$user.subscription" },
        paymentStatus: { $first: "$user.paymentStatus" },

        pointsEarned: { $sum: { $ifNull: ["$pointsEarned", 0] } },
        pointsRedeemed: { $sum: { $ifNull: ["$pointRedeemed", 0] } },
        totalRevenue: { $sum: { $ifNull: ["$totalBill", 0] } },

        visits: { $sum: 1 },
      },
    },

    /* ================= MASK ================= */
    {
      $addFields: {
        totalRevenue: hideSensitive ? 0 : "$totalRevenue",
      },
    },

    /* ================= FINAL OUTPUT ================= */
    {
      $project: {
        _id: 0,
        customUserId: 1,
        customerName: 1,
        location: 1,
        city: 1,
        subscriptionStatus: 1,
        paymentStatus: 1,
        pointsEarned: 1,
        pointsRedeemed: 1,
        totalRevenue: 1,
        visits: 1,
      },
    },

    { $sort: { totalRevenue: -1 } },
  ];

  console.log("📊 Running aggregation...");

  const records = await Sell.aggregate(pipeline);

  console.log("📦 EXPORT RECORDS:", records.length);

  /* ================= EXCEL ================= */
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Customer Analytics");

  sheet.columns = [
    { header: "Custom ID", key: "customUserId", width: 18 },
    { header: "Customer Name", key: "customerName", width: 25 },
    { header: "Location", key: "location", width: 35 },
    { header: "City", key: "city", width: 18 },
    { header: "Subscription", key: "subscriptionStatus", width: 15 },
    { header: "Payment Status", key: "paymentStatus", width: 18 },
    { header: "Points Accumulated", key: "pointsEarned", width: 18 },
    { header: "Points Redeemed", key: "pointsRedeemed", width: 18 },
    { header: "Revenue", key: "totalRevenue", width: 18 },
    { header: "Visits", key: "visits", width: 12 },
  ];

  records.forEach((r) => sheet.addRow(r));

  sheet.getRow(1).font = { bold: true };

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
  const hideSensitive = userRole === "VIEW_ADMIN";

  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // ===================== FIXED MERCHANT FILTER =====================
  const merchantMatch: Record<string, any> = {
    role: "MERCENT",
    createdAt: { $gte: start, $lte: end },
  };

  // subscription
  if (filters?.subscriptionStatus) {
    merchantMatch.subscription = {
      $regex: filters.subscriptionStatus,
      $options: "i",
    };
  }

  // payment
  if (filters?.paymentStatus) {
    merchantMatch.paymentStatus = {
      $regex: filters.paymentStatus,
      $options: "i",
    };
  }

  // city OR location (UNIFIED FIX)
  if (filters?.city || filters?.location) {
    merchantMatch.city = {
      $regex: filters.city || filters.location,
      $options: "i",
    };
  }

  // name
  if (filters?.customerName) {
    merchantMatch.firstName = {
      $regex: filters.customerName,
      $options: "i",
    };
  }

  // ===================== STEP 1: GET MERCHANTS =====================
  const merchants = await User.find(merchantMatch)
    .select(
      "_id firstName lastName email phone city subscription paymentStatus customUserId createdAt"
    )
    .lean<any[]>();

  const merchantIds = merchants.map((m) => m._id);

  if (!merchantIds.length) return { records: [] };

  // ===================== STEP 2: SALES AGG =====================
  const salesAgg = await Sell.aggregate([
    {
      $match: {
        merchantId: { $in: merchantIds },
        createdAt: { $gte: start, $lte: end },
        status: "completed",
      },
    },
    {
      $group: {
        _id: "$merchantId",
        totalRevenue: { $sum: "$totalBill" },
        pointsEarned: { $sum: "$pointsEarned" },
        pointsRedeemed: { $sum: "$pointRedeemed" },
        visit: { $sum: 1 },
      },
    },
  ]);

  const salesMap = new Map();
  salesAgg.forEach((s) =>
    salesMap.set(s._id.toString(), {
      totalRevenue: s.totalRevenue,
      pointsEarned: s.pointsEarned,
      pointsRedeemed: s.pointsRedeemed,
      visit: s.visit,
    })
  );

  // ===================== STEP 3: MERGE =====================
  const records = merchants.map((m) => {
    const sales = salesMap.get(m._id.toString());

    return {
      merchantId: m._id.toString(),
      customUserId: m.customUserId,
      merchantName: `${m.firstName || ""} ${m.lastName || ""}`.trim(),
      email: m.email,
      phone: m.phone,
      location: m.city,

      subscriptionStatus: m.subscription,
      paymentStatus: m.paymentStatus,

      pointsAccumulated: sales?.pointsEarned || 0,
      totalRevenue: sales?.totalRevenue || 0,
      pointsEarned: sales?.pointsEarned || 0,

      pointsRedeemed: hideSensitive ? 0 : sales?.pointsRedeemed || 0,

      visit: sales?.visit || 0,
      date: m.createdAt,
    };
  });

  // ===================== SORT =====================
  records.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // ===================== PAGINATION =====================
  if (limit > 0) {
    const skip = (page - 1) * limit;
    return {
      records: records.slice(skip, skip + limit),
    };
  }

  return { records };
};

const getMerchantAnalyticsMonthly = async (
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10,
  filters?: AnalyticsFilters,
  userRole: string = "SUPER_ADMIN",
  merchantId?: string
) => {
  const hideSensitive = userRole === "VIEW_ADMIN";

  console.log("🚀 [SERVICE] Monthly Analytics Called");

  // ---------------- DATE RANGE ----------------
  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  console.log("📅 [SERVICE] Date Range:", { start, end });

  if (!merchantId) {
    console.log("❌ [SERVICE] Merchant ID missing");
    throw new Error("Merchant ID missing from token");
  }

  let merchantObjectId: mongoose.Types.ObjectId;

  try {
    merchantObjectId = new mongoose.Types.ObjectId(merchantId);
  } catch (err) {
    console.log("❌ [SERVICE] Invalid Merchant ID:", merchantId);
    throw new Error("Invalid merchant ID");
  }

  console.log("🆔 [SERVICE] Merchant ObjectId:", merchantObjectId);

  // ---------------- MONTHLY AGGREGATION ----------------
  const monthlyRaw = await Sell.aggregate([
    {
      $match: {
        merchantId: merchantObjectId,

        // 🔥 FIX: status flexible (big issue fix)
        status: { $in: ["completed", "COMPLETED", "success", "done"] },

        createdAt: { $gte: start, $lte: end },
      },
    },

    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },

        totalRevenue: { $sum: "$totalBill" },
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
        totalPointsRedeemed: hideSensitive
          ? { $literal: 0 }
          : "$totalPointsRedeemed",
        totalUsers: 1,
      },
    },

    { $sort: { year: 1, month: 1 } },
  ]);

  console.log("📊 [SERVICE] Aggregation count:", monthlyRaw.length);

  if (!monthlyRaw.length) {
    console.log("⚠️ [SERVICE] No monthly data found");
  } else {
    console.log("🧾 [SERVICE] Sample:", monthlyRaw[0]);
  }

  // ---------------- MAP ----------------
  const monthMap = new Map<string, any>(
    monthlyRaw.map((m) => [`${m.year}-${m.month}`, m])
  );

  console.log("🗺️ [SERVICE] MonthMap size:", monthMap.size);

  // ---------------- FILL MONTHS ----------------
  const filledMonthlyData: any[] = [];

  const cursor = new Date(start);
  cursor.setDate(1);

  console.log("🔄 [SERVICE] Filling months...");

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    const key = `${year}-${month}`;
    const found = monthMap.get(key);

    console.log(`📆 [SERVICE] ${key}:`, found ? "FOUND" : "MISSING");

    filledMonthlyData.push({
      year,
      month,
      monthName: monthNames[month - 1],

      totalRevenue: Number(found?.totalRevenue ?? 0),
      totalPointsAccumulated: Number(found?.totalPointsAccumulated ?? 0),
      totalPointsRedeemed: hideSensitive
        ? 0
        : Number(found?.totalPointsRedeemed ?? 0),
      totalUsers: Number(found?.totalUsers ?? 0),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  console.log("✅ [SERVICE] Final result length:", filledMonthlyData.length);

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

  console.log("\n==============================");
  console.log("🚀 REVENUE PER USER SERVICE STARTED (SAFE VERSION)");
  console.log("==============================");

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

  console.log("📦 Match Stage:", matchStage);

  /* =====================================================
     🔥 SAFE PIPELINE (NO DATA LOSS)
  ===================================================== */
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

    /* 🔥 SAFE UNWIND (IMPORTANT FIX) */
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true, // 👈 FIXED
      },
    },

    /* 🔥 ADD DEBUG FLAG */
    {
      $addFields: {
        userExists: { $ne: ["$user", null] },
      },
    },

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

  let totalCount = 0;

  /* =====================================================
     🔥 COUNT PIPELINE (SAFE)
  ===================================================== */
  if (!forExport) {
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

      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          userExists: { $ne: ["$user", null] },
        },
      },

      { $group: { _id: "$user._id" } },

      { $count: "total" },
    ]);

    totalCount = totalCountAgg[0]?.total || 0;

    console.log("📊 Total Count:", totalCount);

    const skip = (page - 1) * limit;
    aggregationPipeline.push({ $skip: skip }, { $limit: limit });
  }

  console.log("🚀 Running aggregation...");

  /* =====================================================
     🔥 MAIN QUERY
  ===================================================== */
  const data = await Subscription.aggregate(aggregationPipeline);

  console.log("✅ Final Result Count:", data.length);
  console.log("📄 Sample:", data[0] || "NO DATA");

  /* =====================================================
     🔥 RESPONSE
  ===================================================== */
  const pagination = !forExport
    ? {
        total: totalCount,
        limit,
        page,
        totalPage: Math.ceil(totalCount / limit),
      }
    : undefined;

  console.log("==============================");
  console.log("🏁 SERVICE COMPLETED");
  console.log("==============================\n");

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
  exportCashReceivableAnalytics,
  getCustomerMonthlyReport
};
