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

export const AnalyticsRoutes = router;
