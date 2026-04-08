"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMercentRoutes = void 0;
const express_1 = require("express");
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const dashboardMercent_controller_1 = require("./dashboardMercent.controller");
const accessMerchentProfile_1 = require("../../middlewares/accessMerchentProfile");
const router = (0, express_1.Router)();
router.get("/merchant-dashboard-report", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, dashboardMercent_controller_1.DashboardMercentController.getMerchantReport);
router.get("/weekly-sell-report", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, dashboardMercent_controller_1.DashboardMercentController.getWeeklySellReport);
router.get("/today-new-members", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), dashboardMercent_controller_1.DashboardMercentController.getTodayNewMembers);
router.get("/customer-chart", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, dashboardMercent_controller_1.DashboardMercentController.getCustomerChart);
router.get("/customer-chart-week", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, dashboardMercent_controller_1.DashboardMercentController.getCustomerChartWeek);
exports.DashboardMercentRoutes = router;
