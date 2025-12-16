import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { AnalyticsController } from "./analytics.controller";

const router = express.Router();

router.get(
  "/business-customer",
  auth(USER_ROLES.MERCENT),
  AnalyticsController.getBusinessCustomerAnalytics
);

router.get(
  "/merchant",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  AnalyticsController.getMerchantAnalytics
);

router.get(
  "/customer",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  AnalyticsController.getCustomerAnalytics
);

export const AnalyticsRoutes = router;
