import { Router } from "express";

import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";

import { DashboardMercentValidation } from "./dashboardMercent.validation";
import { DashboardMercentController } from "./dashboardMercent.controller";

const router = Router();

router.get(
  "/merchant-dashboard-report",
  auth(USER_ROLES.MERCENT, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  DashboardMercentController.getMerchantReport
);

router.get(
  "/weekly-sell-report",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardMercentController.getWeeklySellReport
);

router.get(
  "/today-new-members",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardMercentController.getTodayNewMembers
);
router.get(
  "/customer-chart",
  auth(USER_ROLES.MERCENT),
  DashboardMercentController.getCustomerChart
);

export const DashboardMercentRoutes = router;
