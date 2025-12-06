import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { SellManagementController } from "./sellManagement.controller";

const router = express.Router();

// DIGITAL CARD FETCH (Already exists)
router.get(
  "/digital/:uniqueId",
  auth(),
  SellManagementController.getDigitalCardForMerchant
);

// CREATE APPLY REQUEST
router.post(
  "/apply-request",
  auth(),
  SellManagementController.createApplyRequest
);


// GET /apply-requests/user
router.get(
  "/apply-request/user",
  auth(USER_ROLES.USER , USER_ROLES.MERCENT),
  SellManagementController.getUserRequests
);


// USER APPROVE / REJECT
router.patch(
  "/apply-request/user/:id",
  auth(),
  SellManagementController.userApproveRequest
);

// MERCHANT CONFIRM APPLY REQUEST
router.patch(
  "/apply-request/:requestId",
  auth(USER_ROLES.MERCENT),
  SellManagementController.merchantConfirmRequest
);


export const SellManagementRoute = router;
