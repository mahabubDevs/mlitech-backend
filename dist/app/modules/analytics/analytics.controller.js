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
exports.AnalyticsController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const analytics_service_1 = require("./analytics.service");
const excelExport_1 = require("../../../helpers/excelExport");
// User creates report
const getBusinessCustomerAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const merchantId = user._id;
    const role = user.role;
    const isSubMerchant = user.isSubMerchant;
    const mainMerchantId = (_a = user.merchantId) === null || _a === void 0 ? void 0 : _a.toString();
    const { startDate, endDate, page = "1", limit = "10", subscriptionStatus, customerName, location, city, paymentStatus } = req.query;
    const result = yield analytics_service_1.AnalyticsService.getBusinessCustomerAnalytics(merchantId, startDate, endDate, Number(page), Number(limit), {
        subscriptionStatus: subscriptionStatus,
        customerName: customerName,
        location: location,
        city: city,
        paymentStatus: paymentStatus,
    }, role, isSubMerchant, mainMerchantId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Customer analytics fetched successfully",
        data: result.data,
        pagination: result.pagination,
    });
}));
const exportBusinessCustomerAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantId = req.user._id;
    const { startDate, endDate, subscriptionStatus, customerName, location, } = req.query;
    const buffer = yield analytics_service_1.AnalyticsService.exportBusinessCustomerAnalytics(merchantId, startDate, endDate, {
        subscriptionStatus: subscriptionStatus,
        customerName: customerName,
        location: location,
    });
    res.setHeader("Content-Disposition", "attachment; filename=business-customer-analytics.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
}));
// const getMerchantAnalytics = catchAsync(async (req: Request, res: Response) => {
//   const {
//     startDate,
//     endDate,
//     page = "1",
//     limit = "10",
//     subscriptionStatus,
//     merchantName,
//     location,
//     paymentStatus,
//     city,
//     customerName,
//   } = req.query;
//   console.log("Query received:", req.query); // <-- log incoming query
//   const userRole = (req.user as any)?.role;
//   console.log("User role:", userRole);
//   const result = await AnalyticsService.getMerchantAnalytics(
//     startDate as string,
//     endDate as string,
//     Number(page),
//     Number(limit),
//     {
//       subscriptionStatus: subscriptionStatus as string,
//       merchantName: merchantName as string,
//       location: location as string,
//       paymentStatus: paymentStatus as string,
//       city: city as string,
//       customerName: customerName as string,
//     },
//     userRole
//   );
//   console.log("Analytics result:", result); // <-- log full result
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Merchant analytics fetched successfully",
//     data: result.data,
//     pagination: result.pagination,
//   });
// });
const getMerchantAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { startDate, endDate, page = "1", limit = "10", subscriptionStatus, customerName, location, paymentStatus, city } = req.query;
    console.log("Controller - Received query:", {
        startDate,
        endDate,
        subscriptionStatus,
        customerName,
        location,
        paymentStatus,
        city
    });
    const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    const merchantId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    console.log("Controller - User role:", userRole, "Merchant ID:", merchantId);
    const result = yield analytics_service_1.AnalyticsService.getMerchantAnalytics(startDate, endDate, Number(page), Number(limit), {
        subscriptionStatus: subscriptionStatus,
        customerName: customerName,
        location: location,
        paymentStatus: paymentStatus,
        city: city
    }, userRole);
    console.log("Controller - Records Fetched:", result.data.records.length, "Total Records Count:", result.pagination.total);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Merchant customer analytics fetched successfully",
        data: result.data,
        pagination: result.pagination,
    });
}));
const getCustomerAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { startDate, endDate, page = "1", limit = "10", subscriptionStatus, customerName, location, paymentStatus, city } = req.query;
    console.log("Controller - Received query:", {
        startDate,
        endDate,
        subscriptionStatus,
        customerName,
        location,
        paymentStatus,
        city
    });
    // Get logged-in user role
    const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    console.log("Controller - User Role:", userRole);
    const result = yield analytics_service_1.AnalyticsService.getCustomerAnalytics(startDate, endDate, Number(page), Number(limit), {
        subscriptionStatus: subscriptionStatus,
        customerName: customerName,
        location: location,
        paymentStatus: paymentStatus,
        city: city
    }, userRole // pass role
    );
    console.log("Records Fetched:", result.data.records.length, "Total Records Count:", result.pagination.total);
    console.log("Monthly Data Count:", result.data.monthlyData.length, "Sensitive fields masked:", userRole === "VIEW_ADMIN");
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Customer analytics fetched successfully",
        data: result.data,
        pagination: result.pagination,
    });
}));
// const getCustomerAnalytics = catchAsync(async (req: Request, res: Response) => {
//   const {
//     startDate,
//     endDate,
//     page = "1",
//     limit = "10",
//     subscriptionStatus,
//     customerName,
//     location,
//     paymentStatus,
//     city,
//   } = req.query;
//   console.log("Controller - Received query:", {
//     startDate,
//     endDate,
//     subscriptionStatus,
//     customerName,
//     location,
//     paymentStatus,
//     city
//   });
//   // Get logged-in user role
//   const userRole = (req.user as any)?.role;
//   console.log("Controller - User Role:", userRole);
//   // ---------------- Normalize paymentStatus ----------------
//   const normalizedPaymentStatus = paymentStatus ? (paymentStatus as string).toLowerCase() : undefined;
//   console
//   const result = await AnalyticsService.getCustomerAnalytics(
//     startDate as string,
//     endDate as string,
//     Number(page),
//     Number(limit),
//     {
//       subscriptionStatus: subscriptionStatus as string,
//       customerName: customerName as string,
//       location: location as string,
//       paymentStatus: normalizedPaymentStatus, // small case send
//       city: city as string
//     },
//     userRole
//   );
//   console.log(
//     "Controller - Records Fetched:", result.data.records.length,
//     "Total Records Count:", result.pagination.total
//   );
//   console.log(
//     "Controller - Monthly Data Count:", result.data.monthlyData.length,
//     "Sensitive fields masked:", userRole === "VIEW_ADMIN"
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Customer analytics fetched successfully",
//     data: result.data,
//     pagination: result.pagination,
//   });
// });
const exportCustomerAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, subscriptionStatus, customerName, location } = req.query;
    const buffer = yield analytics_service_1.AnalyticsService.exportCustomerAnalytics(startDate, endDate, {
        subscriptionStatus: subscriptionStatus,
        customerName: customerName,
        location: location,
    });
    res.setHeader("Content-Disposition", "attachment; filename=customer-analytics-full.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.status(200).send(buffer);
}));
// controller
// controller.ts
const exportMerchantAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, subscriptionStatus, customerName, location, paymentStatus, city, } = req.query;
    console.log("🚀 Export filters:", {
        startDate,
        endDate,
        subscriptionStatus,
        customerName,
        location,
        paymentStatus,
        city,
    });
    const result = yield analytics_service_1.AnalyticsService.getMerchantAnalyticsExport(startDate, endDate, 1, 0, // export all
    {
        subscriptionStatus: subscriptionStatus,
        customerName: customerName,
        location: location,
        paymentStatus: paymentStatus,
        city: city,
    });
    console.log("🔹 Total records:", result.records.length);
    if (!result.records.length) {
        console.log("⚠️ No data found");
    }
    // ✅ Ensure safe values
    const safeRows = result.records.map((r) => (Object.assign(Object.assign({}, r), { pointsAccumulated: r.pointsAccumulated || 0, pointsRedeemed: r.pointsRedeemed || 0, totalRevenue: r.totalRevenue || 0, subscriptionStatus: r.subscriptionStatus || "inactive" })));
    const columns = [
        { header: "Business Name", key: "merchantName" },
        { header: "Email", key: "email" },
        { header: "Phone", key: "phone" },
        { header: "Location", key: "location" },
        { header: "Subscription Status", key: "subscriptionStatus" },
        { header: "Payment Status", key: "paymentStatus" },
        { header: "Points Accumulated", key: "pointsAccumulated" },
        { header: "Points Redeemed", key: "pointsRedeemed" },
        { header: "Total Revenue", key: "totalRevenue" },
        { header: "Joining Date", key: "date" },
    ];
    const buffer = yield (0, excelExport_1.generateExcelBuffer)({
        sheetName: "Merchant Analytics",
        columns,
        rows: safeRows,
    });
    res.setHeader("Content-Disposition", `attachment; filename=merchant-analytics.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
}));
const exportMerchantMonthlyAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.query;
    console.log("🚀 Monthly export request:", { startDate, endDate });
    // ---------------- Fetch monthlyData ----------------
    const result = yield analytics_service_1.AnalyticsService.getMerchantAnalyticsMonthly(startDate, endDate, 1, // page ignored
    0, // limit 0 = fetch all
    {} // no filters needed, full monthly data
    );
    const monthlyData = result.data.monthlyData;
    console.log("🔹 Monthly records count:", monthlyData.length);
    console.log("🔸 Sample records:", monthlyData.slice(0, 5));
    // ---------------- Excel Columns ----------------
    const columns = [
        { header: "Year", key: "year" },
        { header: "Month", key: "monthName" },
        { header: "Total Revenue", key: "totalRevenue" },
        { header: "Points Redeemed", key: "pointsRedeemed" },
        { header: "Users Count", key: "usersCount" },
    ];
    // ---------------- Generate Excel ----------------
    const buffer = yield (0, excelExport_1.generateExcelBuffer)({
        sheetName: "Monthly Analytics",
        columns,
        rows: monthlyData,
    });
    console.log("✅ Excel buffer generated, size:", buffer.length, "bytes");
    res.setHeader("Content-Disposition", `attachment; filename=merchant-monthly-analytics.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
}));
const exportCustomerMonthlyData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, userRole } = req.query;
    console.log("🚀 Customer Monthly export request:", { startDate, endDate, userRole });
    // -------- Fetch Monthly Report --------
    const result = yield analytics_service_1.AnalyticsService.getCustomerMonthlyReport(startDate, endDate, {}, // filters
    userRole || "USER");
    const monthlyData = result.monthlyData;
    console.log("🔹 Monthly data count:", monthlyData.length);
    console.log("🔸 Sample data:", monthlyData.slice(0, 5));
    // -------- Excel Columns --------
    const columns = [
        { header: "Year", key: "year" },
        { header: "Month", key: "monthName" },
        { header: "Total Revenue", key: "totalRevenue" },
        { header: "Points Earned", key: "pointsEarned" },
        { header: "Points Redeemed", key: "pointsRedeemed" },
        { header: "Users Count", key: "users" },
    ];
    // -------- Generate Excel --------
    const buffer = yield (0, excelExport_1.generateExcelBuffer)({
        sheetName: "Customer Monthly Report",
        columns,
        rows: monthlyData,
    });
    res.setHeader("Content-Disposition", `attachment; filename=customer-monthly-report.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
}));
const getPointRedeemedAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = yield analytics_service_1.AnalyticsService.getPointRedeemedAnalytics({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page,
        limit,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Point redeemed analytics fetched successfully",
        data: { data: result.data, timeRange: result.timeRange },
        pagination: result.pagination
    });
}));
const exportPointRedeemedAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.query;
    yield analytics_service_1.AnalyticsService.exportPointRedeemedAnalytics(res, startDate, endDate);
}));
const getRevenuePerUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = yield analytics_service_1.AnalyticsService.getRevenuePerUser({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page,
        limit,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Revenue per user analytics fetched successfully",
        data: { data: result.data, timeRange: result.timeRange },
        pagination: result.pagination
    });
}));
const exportRevenuePerUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.query;
    yield analytics_service_1.AnalyticsService.exportRevenuePerUser(res, startDate, endDate);
}));
const getCashCollectionAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = yield analytics_service_1.AnalyticsService.getCashCollectionAnalytics({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page,
        limit,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Cash collection analytics fetched successfully",
        data: { data: result.data, timeRange: result.timeRange },
        pagination: result.pagination
    });
}));
const exportCashCollectionAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.query;
    yield analytics_service_1.AnalyticsService.exportCashCollectionAnalytics(res, startDate, endDate);
}));
const getCashReceivableAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = yield analytics_service_1.AnalyticsService.getCashReceivableAnalytics({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page,
        limit,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Cash receivable analytics fetched successfully",
        data: { data: result.data, timeRange: result.timeRange },
        pagination: result.pagination
    });
}));
const exportCashReceivableAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.query;
    yield analytics_service_1.AnalyticsService.exportCashReceivableAnalytics(res, startDate, endDate);
}));
exports.AnalyticsController = {
    getBusinessCustomerAnalytics,
    getMerchantAnalytics,
    getCustomerAnalytics,
    exportMerchantAnalytics,
    exportCustomerAnalytics,
    exportBusinessCustomerAnalytics,
    exportMerchantMonthlyAnalytics,
    exportCustomerMonthlyData,
    getPointRedeemedAnalytics,
    exportPointRedeemedAnalytics,
    getRevenuePerUser,
    exportRevenuePerUser,
    getCashCollectionAnalytics,
    exportCashCollectionAnalytics,
    getCashReceivableAnalytics,
    exportCashReceivableAnalytics
};
