"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRoutes = void 0;
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const dasboard_validation_1 = require("./dasboard.validation");
const router = (0, express_1.Router)();
router.get("/total-revenue", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(dasboard_validation_1.DashboardValidation.totalRevenueZodSchema), dashboard_controller_1.DashboardController.getTotalRevenue);
router.get("/admin-statistics", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(dasboard_validation_1.DashboardValidation.getStatisticsForAdminDashboardZodSchema), dashboard_controller_1.DashboardController.getStatisticsForAdminDashboard);
router.get("/yearly-revenue", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(dasboard_validation_1.DashboardValidation.getYearlyRevenueZodSchema), dashboard_controller_1.DashboardController.getYearlyRevenue);
exports.DashboardRoutes = router;
