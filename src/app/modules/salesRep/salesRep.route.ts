import express from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import { SalesRepController } from "./salesRep.controller";

import { SalesRepValidation } from "./salesRep.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(SalesRepValidation.createSalesRepDataZodSchema),
  SalesRepController.createSalesRepData
);
router.get(
  "/",
  auth(),
  SalesRepController.getSalesRepData
);
router.patch(
  "/:id/acknowledge",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ADMIN_SELL, USER_ROLES.ADMIN_REP),
  SalesRepController.updateUserAcknowledgeStatus
);

router.post(
  "/token/users/:id",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ADMIN_SELL, USER_ROLES.ADMIN_REP),
  SalesRepController.generateToken
);

router.post(
  "/validate",
  auth(USER_ROLES.USER),
  validateRequest(SalesRepValidation.validateTokenZodSchema),
  SalesRepController.validateToken
);

export const SalesRepRoutes = router;
