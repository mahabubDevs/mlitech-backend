"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const admin_controller_1 = require("./admin.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const admin_validation_1 = require("./admin.validation");
const fileUploaderHandler_1 = __importDefault(require("../../middlewares/fileUploaderHandler"));
const router = express_1.default.Router();
router.post("/create-admin", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(admin_validation_1.AdminValidation.createAdminZodSchema), admin_controller_1.AdminController.createAdmin);
router.get("/get-admin", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), admin_controller_1.AdminController.getAdmin);
router.delete("/:id", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), admin_controller_1.AdminController.deleteAdmin);
router.patch("/users/:id/status", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(admin_validation_1.AdminValidation.updateUserStausZodSchema), admin_controller_1.AdminController.updateUserStatus);
router.get("/customers", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.ADMIN_REP), admin_controller_1.AdminController.getAllCustomers);
//=============== customer export ===================//
router.get("/customers/export", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.exportCustomers);
// ========================= mercent crue operations ========================= //
//=== all merchants ===//
router.get("/merchants", (0, auth_1.default)(), admin_controller_1.AdminController.getAllMerchants);
router.get("/merchant-sells/:merchantId", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.ADMIN_REP, user_1.USER_ROLES.ADMIN_SELL), admin_controller_1.AdminController.getMerchantCustomerStats);
router.get("/merchants/export", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.exportMerchants);
router.get("/merchants/nearby", (0, auth_1.default)(), admin_controller_1.AdminController.getNearbyMerchantsController);
//===singel merchant details ===//
router.get("/merchants/:id", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.getSingleMerchant);
//=== update merchant ===//
router.patch("/merchants/:id", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, fileUploaderHandler_1.default)(), // <-- your upload middleware
admin_controller_1.AdminController.updateMerchant);
//=== delete merchant ===//
router.delete("/merchants/:id", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.deleteMerchant);
//=== merchant status update ===//
router.patch("/merchants/status/:id", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.updateMerchantStatus);
router.patch("/merchants/:id/approve-status", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(admin_validation_1.AdminValidation.updateMerchantApproveStatusZodSchema), admin_controller_1.AdminController.updateMerchantApproveStatus);
// ========================= customer crue operations ========================= //
//=== all customers ===//
router.get("/customers", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.ADMIN_REP, user_1.USER_ROLES.ADMIN_SELL), admin_controller_1.AdminController.getAllCustomers);
router.get("/customer-sells/:userId", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.VIEW_ADMIN, user_1.USER_ROLES.ADMIN_REP, user_1.USER_ROLES.ADMIN_SELL), admin_controller_1.AdminController.getCustomerSellDetails);
//===singel customer details ===//
router.get("/customers/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), admin_controller_1.AdminController.getSingleCustomer);
//=== update customer ===//
router.patch("/customers/:id", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, fileUploaderHandler_1.default)(), admin_controller_1.AdminController.updateCustomer);
//=== delete customer ===//
router.delete("/customers/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), admin_controller_1.AdminController.deleteCustomer);
//=== customer status update ===//
router.patch("/customers/:id/status", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), admin_controller_1.AdminController.updateCustomerStatus);
exports.AdminRoutes = router;
