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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMercentController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const dashboardMercent_service_1 = require("./dashboardMercent.service");
// Dashboard Stats
const getTotalRevenue = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dashboardMercent_service_1.DashboardMercentService.getTotalRevenue(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Total revenue fetched successfully",
        data: result,
    });
}));
const getStatisticsForAdminDashboard = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const range = req.query.range || "7d";
    const result = yield dashboardMercent_service_1.DashboardMercentService.getStatisticsForAdminDashboard(range);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Statistics fetched successfully",
        data: result,
    });
}));
const getYearlyRevenue = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dashboardMercent_service_1.DashboardMercentService.getYearlyRevenue(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Statistics fetched successfully",
        data: result,
    });
}));
const getMerchantReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        // ✅ Decide which ID to use for filtering
        const filterId = (user === null || user === void 0 ? void 0 : user.isSubMerchant) ? user.merchantId : user._id;
        if (!filterId || !mongoose_1.Types.ObjectId.isValid(filterId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized merchant",
            });
        }
        const merchantId = filterId;
        // Get range from query, default to "7d"
        const range = req.query.range || "7d";
        // Call service to get dashboard report
        const result = yield dashboardMercent_service_1.DashboardMercentService.getReportForMerchantDashboard(merchantId, range);
        // Send response
        (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Merchant report fetched successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("❌ Error in getMerchantReport:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
}));
const getWeeklySellReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        // ✅ Decide which ID to use for filtering (sub-merchant or main merchant)
        const filterId = (user === null || user === void 0 ? void 0 : user.isSubMerchant) ? user.merchantId : user._id;
        if (!filterId || !mongoose_1.Types.ObjectId.isValid(filterId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized merchant",
            });
        }
        const merchantId = filterId;
        // Call service to get weekly sell report
        const result = yield dashboardMercent_service_1.DashboardMercentService.getWeeklySellReport(merchantId);
        (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Weekly sell report fetched successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("❌ Error in getWeeklySellReport:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
}));
const getTodayNewMembers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const merchantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const result = yield dashboardMercent_service_1.DashboardMercentService.getTodayNewMembers(merchantId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Today's new members fetched successfully",
        data: result,
    });
}));
const getCustomerChart = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // ✅ Decide which ID to use for filtering
    const filterId = (user === null || user === void 0 ? void 0 : user.isSubMerchant) ? user.merchantId : user._id;
    const year = Number(req.query.year) || undefined;
    const result = yield dashboardMercent_service_1.DashboardMercentService.getCustomerChart(filterId, year);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Customer chart fetched successfully",
        data: result,
    });
}));
const getCustomerChartWeek = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        // ✅ Same filtering logic as weekly report
        const filterId = (user === null || user === void 0 ? void 0 : user.isSubMerchant) ? user.merchantId : user._id;
        if (!filterId || !mongoose_1.Types.ObjectId.isValid(filterId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized merchant",
            });
        }
        const merchantId = filterId;
        const { startDate, endDate } = req.query;
        const result = yield dashboardMercent_service_1.DashboardMercentService.getCustomerChartWeek(merchantId, startDate, endDate);
        (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Customer chart data fetched successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("❌ Error in getCustomerChartWeek:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
}));
exports.DashboardMercentController = {
    getTotalRevenue,
    getStatisticsForAdminDashboard,
    getYearlyRevenue,
    getMerchantReport,
    getWeeklySellReport,
    getTodayNewMembers,
    getCustomerChartWeek,
    getCustomerChart,
};
