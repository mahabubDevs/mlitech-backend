import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { AnalyticsController } from "./analytics.controller";

const router = express.Router();

router.get(
  "/business-customer",
  auth(USER_ROLES.MERCENT),
  AnalyticsController.getCustomerAnalytics
);

router.get(
  "/merchant",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  AnalyticsController.getMerchantAnalytics
);
export const AnalyticsRoutes = router;
