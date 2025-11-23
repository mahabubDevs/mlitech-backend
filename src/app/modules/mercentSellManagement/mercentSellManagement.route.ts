// merchantSellManagement.route.ts
import express from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import { MerchantSellManagementController } from "./mercentSellManagement.service";


const router = express.Router();

router.get(
  "/customer",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MerchantSellManagementController.findCustomer
);

router.post(
  "/calculate",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MerchantSellManagementController.calculate
);

router.post(
  "/transaction/complete",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MerchantSellManagementController.completeTransaction
);

export default router;
