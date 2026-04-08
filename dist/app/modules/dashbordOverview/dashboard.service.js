"use strict";
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
exports.DashboardService = void 0;
const subscription_model_1 = require("../subscription/subscription.model");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enums/user");
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
    var _a;
    const now = new Date();
    // Start of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    // Start of this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // Start of this year
    const yearStart = new Date(now.getFullYear(), 0, 1);
    // Start of last 1,7,30 days
    const last1Day = new Date();
    last1Day.setDate(now.getDate() - 1);
    last1Day.setHours(0, 0, 0, 0);
    const last7Days = new Date();
    last7Days.setDate(now.getDate() - 7);
    const last30Days = new Date();
    last30Days.setDate(now.getDate() - 30);
    const ranges = {
        "1d": last1Day,
        "7d": last7Days,
        "30d": last30Days,
        today: todayStart,
        month: monthStart,
        year: yearStart,
        all: undefined,
    };
    const startDate = range === "all" ? undefined : ranges[range];
    // const startDate = ranges[range] ?? ranges["7d"];
    // Build match stage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchStage = {};
    if (startDate)
        matchStage.createdAt = { $gte: startDate };
    const [revenueResult, customerCount, providerCount, pendingApprovals] = yield Promise.all([
        subscription_model_1.Subscription.aggregate([
            { $match: matchStage },
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
        subscriptionRevenue: ((_a = revenueResult[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0,
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
exports.DashboardService = {
    getTotalRevenue,
    getStatisticsForAdminDashboard,
    getYearlyRevenue,
};
