"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellManagementRoute = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const user_1 = require("../../../../enums/user");
const mercentSellManagement_controller_1 = __importDefault(require("./mercentSellManagement.controller"));
const accessMerchentProfile_1 = require("../../../middlewares/accessMerchentProfile");
const router = express_1.default.Router();
router.post("/checkout", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, mercentSellManagement_controller_1.default.checkout);
router.get("/pending-checkouts", (0, auth_1.default)(user_1.USER_ROLES.USER), mercentSellManagement_controller_1.default.getLastPendingSell);
// router.post(
//   "/promotion/request-approval",
//   auth(USER_ROLES.MERCENT),
//   mercentSellManagementController.requestApproval
// );
// router.post(
//   "/promotion/approve",
//   auth(USER_ROLES.USER),
//   mercentSellManagementController.approvePromotion
// );
// Merchant → Request Approval
router.post("/promotion/request-approval", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, mercentSellManagement_controller_1.default.requestApproval);
// User → Get Pending Promotions
router.get("/promotion/pending", (0, auth_1.default)(), mercentSellManagement_controller_1.default.getPendingRequests);
// User → Approve / Reject Promotion
router.post("/promotion/accept", (0, auth_1.default)(user_1.USER_ROLES.USER), mercentSellManagement_controller_1.default.approvePromotion);
router.post("/promotion/reject", (0, auth_1.default)(user_1.USER_ROLES.USER), mercentSellManagement_controller_1.default.approvePromotionreject);
// User sees points transaction history
router.get("/points-history", (0, auth_1.default)(), mercentSellManagement_controller_1.default.getPointsHistory);
// Get full transactions of a user (merchant)
router.get("/transactions/:userId", (0, auth_1.default)(), mercentSellManagement_controller_1.default.getUserFullTransactions);
router.get("/merchant", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, mercentSellManagement_controller_1.default.getMerchantSales);
router.get("/customer", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, mercentSellManagement_controller_1.default.getMerchantCustomersList);
router.get("/recent-new/customer", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, mercentSellManagement_controller_1.default.getRecentMerchantCustomersList);
router.get("/customer/export", (0, auth_1.default)(user_1.USER_ROLES.MERCENT), mercentSellManagement_controller_1.default.exportMerchantCustomersExcel);
// router.post(
//   "/finalize-checkout",
//   auth(USER_ROLES.MERCENT),
//   mercentSellManagementController.finalizeCheckout
// );
exports.SellManagementRoute = router;
