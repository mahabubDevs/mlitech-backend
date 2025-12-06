import { Subscription } from "../subscription/subscription.model";
import { User } from "../user/user.model";
import { USER_ROLES, USER_STATUS } from "../../../enums/user";
import { ApplyRequest } from "../sellManagement/sellManagement.model";
import { GiftCard } from "../giftCard/giftCard.model";
import mongoose from "mongoose";

const getTotalRevenue = async (query: any) => {
  const startDate = new Date(query.start);
  const endDate = new Date(query.end);
  const revenueData = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        revenue: { $sum: "$price" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            {
              $arrayElemAt: [
                [
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
                ],
                { $subtract: ["$_id.month", 1] },
              ],
            },
            " ",
            { $toString: "$_id.year" },
          ],
        },
        revenue: 1,
      },
    },
  ]);

  // 2️⃣ Generate all months in range
  const allMonths: string[] = [];
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    const monthStr = `${
      [
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
      ][current.getMonth()]
    } ${current.getFullYear()}`;
    allMonths.push(monthStr);
    current.setMonth(current.getMonth() + 1);
  }

  // 3️⃣ Merge aggregation result with all months, fill 0 for missing
  const revenueMap = revenueData.reduce((acc, item) => {
    acc[item.month] = item.revenue;
    return acc;
  }, {} as Record<string, number>);

  const finalData = allMonths.map((month) => ({
    month,
    revenue: revenueMap[month] || 0,
  }));

  return finalData;
};

const getStatisticsForAdminDashboard = async (range: string) => {
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const ranges: Record<string, Date | undefined> = {
    today: todayStart,
    "7d": new Date(now.setDate(now.getDate() - 7)),
    "30d": new Date(now.setDate(now.getDate() - 30)),
    all: undefined,
  };

  const startDate = range === "all" ? undefined : ranges[range] ?? ranges["7d"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchStage: any = {};
  if (startDate) matchStage.createdAt = { $gte: startDate };

  const [revenueResult, customerCount, providerCount, pendingApprovals] =
    await Promise.all([
      Subscription.aggregate([
        {
          $match: matchStage,
        },
        { $group: { _id: null, totalRevenue: { $sum: "$price" } } },
      ]),

      User.countDocuments({
        role: USER_ROLES.USER,
        ...(startDate ? { createdAt: { $gte: startDate } } : {}),
      }),

      User.countDocuments({
        role: USER_ROLES.MERCENT,
        ...(startDate ? { createdAt: { $gte: startDate } } : {}),
      }),

      User.countDocuments({
        role: USER_ROLES.MERCENT,
        status: USER_STATUS.INACTIVE,
        ...(startDate ? { createdAt: { $gte: startDate } } : {}),
      }),
    ]);

  return {
    range,
    customers: customerCount,
    providers: providerCount,
    pendingApprovals,
    subscriptionRevenue: revenueResult[0]?.totalRevenue || 0,
  };
};

const getYearlyRevenue = async (query: any) => {
  const startDate = query.start ? new Date(query.start) : undefined;
  const endDate = query.end ? new Date(query.end) : undefined;
  const matchStage: Record<string, any> = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  // Aggregate revenue by year
  const revenueData = await Subscription.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { year: { $year: "$createdAt" } },
        totalRevenue: { $sum: "$price" },
      },
    },
    { $sort: { "_id.year": 1 } },
  ]);

  // Determine start and end year
  const years = revenueData.map((r) => r._id.year);
  const minYear = startDate ? startDate.getFullYear() : Math.min(...years);
  const maxYear = endDate ? endDate.getFullYear() : Math.max(...years);

  // Fill missing years with 0 revenue
  const result: { year: number; totalRevenue: number }[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    const yearData = revenueData.find((r) => r._id.year === y);
    result.push({
      year: y,
      totalRevenue: yearData?.totalRevenue || 0,
    });
  }

  return result;
};




const getReportForMerchantDashboard = async (
  merchantId: string,
  range: string = "7d"
) => {
  const today = new Date();
  let startDate: Date | undefined;

  switch (range) {
    case "today":
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      break;
    case "7d":
      startDate = new Date();
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "1m":
      startDate = new Date();
      startDate.setMonth(today.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "3m":
      startDate = new Date();
      startDate.setMonth(today.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate = new Date();
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  const dateFilter = startDate ? { $gte: startDate, $lte: today } : undefined;

  // Total Members = unique buyers
  const buyersQuery: any = {
    merchantId: new mongoose.Types.ObjectId(merchantId),
    userId: { $ne: null },
  };
  if (dateFilter) buyersQuery.createdAt = dateFilter;

  const buyers = await GiftCard.distinct("userId", buyersQuery);
  const totalMembers = buyers.length;

  // Rewards Redeemed = giftcard status = redeem
  const redeemedQuery: any = { merchantId: new mongoose.Types.ObjectId(merchantId), status: "redeem" };
  if (dateFilter) redeemedQuery.createdAt = dateFilter;
  const rewardsRedeemed = await GiftCard.countDocuments(redeemedQuery);

  // Total Points Issued = sum(pointsEarned)
  const pointsMatch: any = { merchantId: new mongoose.Types.ObjectId(merchantId) };
  if (dateFilter) pointsMatch.createdAt = dateFilter;

  const pointsAgg = await ApplyRequest.aggregate([
    { $match: pointsMatch },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: "$pointsEarned" },
      },
    },
  ]);
  const totalPointsIssued = pointsAgg[0]?.totalPoints || 0;

  // Total Sales = sum(billAmount)
  const salesMatch: any = { merchantId: new mongoose.Types.ObjectId(merchantId), status: "merchant_confirmed" };
  if (dateFilter) salesMatch.createdAt = dateFilter;

  const salesAgg = await ApplyRequest.aggregate([
    { $match: salesMatch },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$billAmount" },
      },
    },
  ]);
  const totalSales = salesAgg[0]?.totalSales || 0;

  return {
    range,
    totalSales,
    totalMembers,
    totalPointsIssued,
    rewardsRedeemed,
  };
};




const getWeeklySellReport = async (merchantId: string) => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6); // last 7 days

  // last 7 days ApplyRequest fetch + daily total
  const data = await ApplyRequest.aggregate([
    {
      $match: {
        merchantId: new mongoose.Types.ObjectId(merchantId),
        createdAt: { $gte: sevenDaysAgo, $lte: today },
        status: "merchant_confirmed", // or "approved"
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalSell: { $sum: "$billAmount" },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let totalSell = 0;

  const result: any[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() - (6 - i));
    const formatted = date.toISOString().split("T")[0];
    const dayName = dayNames[date.getDay()];

    const found = data.find(d => d._id === formatted);
    const dailySell = found?.totalSell || 0;
    totalSell += dailySell;

    result.push({
      day: dayName,
      totalSell: dailySell,
      totalOrders: found?.totalOrders || 0,
    });
  }

  // percentage
  const finalResult = result.map(day => ({
    ...day,
    percentage: totalSell > 0 ? Number(((day.totalSell / totalSell) * 100).toFixed(2)) : 0,
  }));

  return {
    totalSell, // 7 days total
    weeklyReport: finalResult,
  };
};


const getTodayNewMembers = async (merchantId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Fetch giftcards bought today
  const giftCards = await GiftCard.find({
    merchantId: new mongoose.Types.ObjectId(merchantId),
    userId: { $ne: null },
    createdAt: { $gte: todayStart, $lte: todayEnd },
  })
    .populate("userId", "firstName lastName email phone") // buyer details
    .sort({ createdAt: -1 })
    .lean();

  return giftCards.map(gc => ({
    giftCardId: gc._id,
    title: gc.title,
    user: gc.userId,
    points: gc.points,
    boughtAt: gc.createdAt,
  }));
};


export const DashboardMercentService = {
  getReportForMerchantDashboard,
  getWeeklySellReport,
  getTotalRevenue,
  getStatisticsForAdminDashboard,
  getYearlyRevenue,
  getTodayNewMembers
};
