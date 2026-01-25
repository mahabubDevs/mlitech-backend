import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import mercentSellManagementController from "./mercentSellManagement.controller";
import { canAccessMerchantProfile } from "../../../middlewares/accessMerchentProfile";


const router = express.Router();

router.post("/checkout", auth(USER_ROLES.MERCENT,USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile, mercentSellManagementController.checkout);

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
router.post("/promotion/request-approval", auth(USER_ROLES.MERCENT,USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile, mercentSellManagementController.requestApproval);

// User → Get Pending Promotions
router.get("/promotion/pending", auth(), mercentSellManagementController.getPendingRequests);

// User → Approve / Reject Promotion
router.post("/promotion/accept", auth(USER_ROLES.USER), mercentSellManagementController.approvePromotion);
router.post("/promotion/reject", auth(USER_ROLES.USER), mercentSellManagementController.approvePromotionreject);

// User sees points transaction history
router.get(
  "/points-history",
  auth(),
  mercentSellManagementController.getPointsHistory
);


// Get full transactions of a user (merchant)
router.get(
  "/transactions/:userId",
  auth(),
  mercentSellManagementController.getUserFullTransactions
);

router.get(
  "/merchant",
  auth(USER_ROLES.MERCENT,USER_ROLES.VIEW_MERCENT,USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile,
  mercentSellManagementController.getMerchantSales
);

router.get(
  "/customer",
  auth(USER_ROLES.MERCENT, USER_ROLES.VIEW_MERCENT,USER_ROLES.USER, USER_ROLES.ADMIN_MERCENT), canAccessMerchantProfile,
  mercentSellManagementController.getMerchantCustomersList
);
router.get(
  "/recent-new/customer",
  auth(USER_ROLES.MERCENT, USER_ROLES.VIEW_MERCENT,USER_ROLES.USER, USER_ROLES.ADMIN_MERCENT), canAccessMerchantProfile,
  mercentSellManagementController.getRecentMerchantCustomersList
);

router.get(
  "/customer/export",
  auth(USER_ROLES.MERCENT,),
  mercentSellManagementController.exportMerchantCustomersExcel
);
// router.post(
//   "/finalize-checkout",
//   auth(USER_ROLES.MERCENT),
//   mercentSellManagementController.finalizeCheckout
// );

export const SellManagementRoute = router;
