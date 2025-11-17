import express from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import { SalesRepController } from "./salesRep.controller";

const router = express.Router();

router.post("/", auth(USER_ROLES.USER), SalesRepController.createSalesRepData);
router.get(
  "/",
  auth(USER_ROLES.SUPER_ADMIN),
  SalesRepController.getSalesRepData
);
router.patch("/acknowledge/users/:Id", auth(USER_ROLES.SUPER_ADMIN));

router.post(
  "/token/users/:id",
  auth(USER_ROLES.SUPER_ADMIN),
  SalesRepController.generateToken
);

router.post(
  "/validate",
  auth(USER_ROLES.USER),
  SalesRepController.validateToken
);

export const SalesRepRoutes = router;
