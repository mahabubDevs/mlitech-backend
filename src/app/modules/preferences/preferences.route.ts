// src/app/modules/userPreference/userPreference.route.ts
import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import validateRequest from "../../middlewares/validateRequest";
import { createUserPreferenceSchema, updateUserPreferenceSchema } from "./preferences.validation";
import { UserPreferenceController } from "./preferences.controller";

const router = express.Router();

router.post(
  "/",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(createUserPreferenceSchema),
  UserPreferenceController.createPreference
);

router.get(
  "/",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  UserPreferenceController.getPreference
);

router.patch(
  "/",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(updateUserPreferenceSchema),
  UserPreferenceController.updatePreference
);

router.delete(
  "/",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  UserPreferenceController.deletePreference
);

export const UserPreferenceRoutes = router;
