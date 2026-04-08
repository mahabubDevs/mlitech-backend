"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMercentService = void 0;
const subscription_model_1 = require("../subscription/subscription.model");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enums/user");
const mongoose_1 = __importStar(require("mongoose"));
const promotionAdmin_model_1 = require("../promotionAdmin/promotionAdmin.model");
const mercentSellManagement_model_1 = require("../mercent/mercentSellManagement/mercentSellManagement.model");
const getTotalRevenue = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const startDate = new Date(query.start);
    const endDate = new Date(query.end);
    const revenueData = yield subscription_model_1.Subscription.aggregate([
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
    const allMonths = [];
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (current <= end) {
        const monthStr = `${[
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
        ][current.getMonth()]} ${current.getFullYear()}`;
        allMonths.push(monthStr);
        current.setMonth(current.getMonth() + 1);
    }
    // 3️⃣ Merge aggregation result with all months, fill 0 for missing
    const revenueMap = revenueData.reduce((acc, item) => {
        acc[item.month] = item.revenue;
        return acc;
    }, {});
    const finalData = allMonths.map((month) => ({
        month,
        revenue: revenueMap[month] || 0,
    }));
    return finalData;
});
const getStatisticsForAdminDashboard = (range) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ranges = {
        today: todayStart,
        "7d": new Date(now.setDate(now.getDate() - 7)),
        "30d": new Date(now.setDate(now.getDate() - 30)),
        all: undefined,
    };
    const startDate = range === "all" ? undefined : (_a = ranges[range]) !== null && _a !== void 0 ? _a : ranges["7d"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchStage = {};
    if (startDate)
        matchStage.createdAt = { $gte: startDate };
    const [revenueResult, customerCount, providerCount, pendingApprovals] = yield Promise.all([
        subscription_model_1.Subscription.aggregate([
            {
                $match: matchStage,
            },
            { $group: { _id: null, totalRevenue: { $sum: "$price" } } },
        ]),
        user_model_1.User.countDocuments(Object.assign({ role: user_1.USER_ROLES.USER }, (startDate ? { createdAt: { $gte: startDate } } : {}))),
        user_model_1.User.countDocuments(Object.assign({ role: user_1.USER_ROLES.MERCENT }, (startDate ? { createdAt: { $gte: startDate } } : {}))),
        user_model_1.User.countDocuments(Object.assign({ role: user_1.USER_ROLES.MERCENT, status: user_1.USER_STATUS.INACTIVE }, (startDate ? { createdAt: { $gte: startDate } } : {}))),
    ]);
    return {
        range,
        customers: customerCount,
        providers: providerCount,
        pendingApprovals,
        subscriptionRevenue: ((_b = revenueResult[0]) === null || _b === void 0 ? void 0 : _b.totalRevenue) || 0,
    };
});
const getYearlyRevenue = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const startDate = query.start ? new Date(query.start) : undefined;
    const endDate = query.end ? new Date(query.end) : undefined;
    const matchStage = {};
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate)
            matchStage.createdAt.$gte = startDate;
        if (endDate)
            matchStage.createdAt.$lte = endDate;
    }
    // Aggregate revenue by year
    const revenueData = yield subscription_model_1.Subscription.aggregate([
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
    const result = [];
    for (let y = minYear; y <= maxYear; y++) {
        const yearData = revenueData.find((r) => r._id.year === y);
        result.push({
            year: y,
            totalRevenue: (yearData === null || yearData === void 0 ? void 0 : yearData.totalRevenue) || 0,
        });
    }
    return result;
});
const getReportForMerchantDashboard = (merchantId_1, ...args_1) => __awaiter(void 0, [merchantId_1, ...args_1], void 0, function* (merchantId, range = "7d") {
    var _a, _b, _c;
    const today = new Date();
    let startDate;
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
        case "all":
            startDate = new Date(0);
            break;
        default:
            startDate = new Date();
            startDate.setDate(today.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            break;
    }
    const dateFilter = { $gte: startDate, $lte: today };
    // 1️⃣ Total Members
    const buyersQuery = {
        merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
        userId: { $ne: null },
        createdAt: dateFilter,
        status: "completed",
    };
    const buyers = yield mercentSellManagement_model_1.Sell.distinct("userId", buyersQuery);
    const totalMembers = buyers.length;
    // 2️⃣ Rewards Redeemed (sum of pointRedeemed)
    const redeemedAgg = yield mercentSellManagement_model_1.Sell.aggregate([
        {
            $match: {
                merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
                createdAt: dateFilter,
                status: "completed",
            },
        },
        {
            $group: {
                _id: null,
                totalRedeemed: { $sum: "$pointRedeemed" },
            },
        },
    ]);
    const rewardsRedeemed = ((_a = redeemedAgg[0]) === null || _a === void 0 ? void 0 : _a.totalRedeemed) || 0;
    // 3️⃣ Total Points Issued
    const pointsAgg = yield mercentSellManagement_model_1.Sell.aggregate([
        {
            $match: {
                merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
                createdAt: dateFilter,
                status: "completed",
            },
        },
        {
            $group: {
                _id: null,
                totalPoints: { $sum: "$pointsEarned" },
            },
        },
    ]);
    const totalPointsIssued = ((_b = pointsAgg[0]) === null || _b === void 0 ? void 0 : _b.totalPoints) || 0;
    // 4️⃣ Total Sales
    const salesAgg = yield mercentSellManagement_model_1.Sell.aggregate([
        {
            $match: {
                merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
                createdAt: dateFilter,
                status: "completed",
            },
        },
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalBill" },
            },
        },
    ]);
    const totalSales = ((_c = salesAgg[0]) === null || _c === void 0 ? void 0 : _c.totalSales) || 0;
    return {
        range,
        totalSales,
        totalMembers,
        totalPointsIssued,
        rewardsRedeemed, // now sum of pointRedeemed
    };
});
const getWeeklySellReport = (merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(today.getDate() - 6); // last 7 days
    // last 7 days Sell fetch + daily total
    const data = yield mercentSellManagement_model_1.Sell.aggregate([
        {
            $match: {
                merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
                createdAt: { $gte: sevenDaysAgo, $lte: today },
                status: "completed", // Sell collection এ completed ব্যবহার
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSell: { $sum: "$totalBill" },
                totalOrders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let totalSell = 0;
    const result = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - (6 - i));
        const formatted = date.toISOString().split("T")[0];
        const dayName = dayNames[date.getDay()];
        const found = data.find((d) => d._id === formatted);
        const dailySell = (found === null || found === void 0 ? void 0 : found.totalSell) || 0;
        totalSell += dailySell;
        result.push({
            day: dayName,
            totalSell: dailySell,
            totalOrders: (found === null || found === void 0 ? void 0 : found.totalOrders) || 0,
        });
    }
    // percentage calculation
    const finalResult = result.map((day) => (Object.assign(Object.assign({}, day), { percentage: totalSell > 0
            ? Number(((day.totalSell / totalSell) * 100).toFixed(2))
            : 0 })));
    return {
        totalSell, // last 7 days total
        weeklyReport: finalResult,
    };
});
const getTodayNewMembers = (merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    // Fetch giftcards bought today
    const promoshonCard = yield promotionAdmin_model_1.Promotion.find({
        merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
        createdAt: { $gte: todayStart, $lte: todayEnd },
    })
        .sort({ createdAt: -1 })
        .lean();
    return promoshonCard.map((gc) => ({
        giftCardId: gc._id,
        title: gc.name,
        user: null,
        discountPercentage: gc.discountPercentage || 0,
        boughtAt: gc.createdAt,
    }));
});
const getCustomerChart = (merchantId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = year || new Date().getFullYear();
    const matchStage = {
        merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
        status: "completed",
        $expr: {
            $eq: [{ $year: "$createdAt" }, currentYear],
        },
    };
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: { month: { $month: "$createdAt" } },
                totalRevenue: { $sum: "$discountedBill" },
                totalDiscount: {
                    $sum: { $subtract: ["$totalBill", "$discountedBill"] },
                },
            },
        },
        { $sort: { "_id.month": 1 } },
    ];
    const data = yield mercentSellManagement_model_1.Sell.aggregate(pipeline);
    const MONTH_NAMES = [
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
    // Ensure all 12 months exist
    const formatted = Array.from({ length: 12 }, (_, idx) => {
        const monthNum = idx + 1;
        const monthData = data.find((d) => d._id.month === monthNum);
        return {
            month: MONTH_NAMES[idx],
            totalRevenue: (monthData === null || monthData === void 0 ? void 0 : monthData.totalRevenue) || 0,
            totalDiscount: (monthData === null || monthData === void 0 ? void 0 : monthData.totalDiscount) || 0,
        };
    });
    return formatted;
});
const getCustomerChartWeek = (merchantId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const from = new Date(`${startDate}T00:00:00Z`);
    const to = new Date(`${endDate}T23:59:59Z`);
    if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
    }
    const pipeline = [
        {
            $match: {
                merchantId: new mongoose_1.Types.ObjectId(merchantId),
                createdAt: { $gte: from, $lte: to },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" },
                },
                totalRevenue: { $sum: "$discountedBill" },
            },
        },
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1,
                "_id.day": 1,
            },
        },
    ];
    const data = yield mercentSellManagement_model_1.Sell.aggregate(pipeline);
    const days = [];
    const current = new Date(from);
    while (current <= to) {
        const y = current.getUTCFullYear();
        const m = current.getUTCMonth() + 1;
        const d = current.getUTCDate();
        const found = data.find((item) => item._id.year === y &&
            item._id.month === m &&
            item._id.day === d);
        days.push({
            date: current.toISOString().slice(0, 10),
            revenue: (found === null || found === void 0 ? void 0 : found.totalRevenue) || 0,
        });
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return days;
});
exports.DashboardMercentService = {
    getReportForMerchantDashboard,
    getWeeklySellReport,
    getTotalRevenue,
    getStatisticsForAdminDashboard,
    getYearlyRevenue,
    getTodayNewMembers,
    getCustomerChart,
    getCustomerChartWeek,
};
