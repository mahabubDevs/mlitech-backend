import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import mercentSellManagementController from "./mercentSellManagement.controller";


const router = express.Router();

router.post("/checkout", auth(USER_ROLES.MERCENT), mercentSellManagementController.checkout);

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
router.post("/promotion/request-approval", auth(USER_ROLES.MERCENT), mercentSellManagementController.requestApproval);

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


router.get("/merchant/:merchantId", auth(), mercentSellManagementController.getMerchantSales);

// router.post(
//   "/finalize-checkout",
//   auth(USER_ROLES.MERCENT),
//   mercentSellManagementController.finalizeCheckout
// );

export const SellManagementRoute = router;
