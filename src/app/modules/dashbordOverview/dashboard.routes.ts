import { Router } from "express";
import { DashboardController } from "./dashboard.controller";

import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";


const router = Router();

// ✅ Age distribution route
router.get(
  "/age-distribution",
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getAgeDistribution
);

router.get(
  "/ethnicity-distribution",
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getEthnicityDistribution
);

// Gender distribution
router.get(
  "/gender-distribution",
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getGenderDistribution
);

// Monthly signups
router.get(
  "/monthly-signups",
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getMonthlySignups
);

export const DashboardRoutes = router;
