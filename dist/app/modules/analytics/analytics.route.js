"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const analytics_controller_1 = require("./analytics.controller");
const accessMerchentProfile_1 = require("../../middlewares/accessMerchentProfile");
const router = express_1.default.Router();
router.get("/business-customer", (0, auth_1.default)(), accessMerchentProfile_1.canAccessMerchantProfile, analytics_controller_1.AnalyticsController.getBusinessCustomerAnalytics);
router.get("/business-customer/export", (0, auth_1.default)(user_1.USER_ROLES.MERCENT), analytics_controller_1.AnalyticsController.exportBusinessCustomerAnalytics);
router.get("/merchant", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.ADMIN_REP), analytics_controller_1.AnalyticsController.getMerchantAnalytics);
router.get("/merchants/export", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), // Only admins
analytics_controller_1.AnalyticsController.exportMerchantAnalytics);
router.get("/merchant/monthly/export", 
// auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
analytics_controller_1.AnalyticsController.exportMerchantMonthlyAnalytics);
router.get("/customer", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.ADMIN_REP), analytics_controller_1.AnalyticsController.getCustomerAnalytics);
router.get("/customer/export", 
// auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
analytics_controller_1.AnalyticsController.exportCustomerAnalytics);
router.get("/customer/monthly/export", 
// auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
analytics_controller_1.AnalyticsController.exportCustomerMonthlyData);
router.get("/accountings/point-redeemed", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.ADMIN_REP), analytics_controller_1.AnalyticsController.getPointRedeemedAnalytics);
router.get("/accountings/point-redeemed/export", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), analytics_controller_1.AnalyticsController.exportPointRedeemedAnalytics);
router.get("/accountings/revenue-per-user", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ADMIN_REP), analytics_controller_1.AnalyticsController.getRevenuePerUser);
router.get("/accountings/revenue-per-user/export", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ADMIN_REP), analytics_controller_1.AnalyticsController.exportRevenuePerUser);
router.get("/accountings/cash-collection", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.ADMIN_REP), analytics_controller_1.AnalyticsController.getCashCollectionAnalytics);
router.get("/accountings/cash-collection/export", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ADMIN_REP), analytics_controller_1.AnalyticsController.exportCashCollectionAnalytics);
router.get("/accountings/cash-receivable", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.ADMIN_REP), analytics_controller_1.AnalyticsController.getCashReceivableAnalytics);
router.get("/accountings/cash-receivable/export", analytics_controller_1.AnalyticsController.exportCashReceivableAnalytics);
exports.AnalyticsRoutes = router;
