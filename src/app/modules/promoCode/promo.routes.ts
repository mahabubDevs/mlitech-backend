import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import fileUploadHandler from "../../middlewares/fileUploaderHandler";
import validateRequest from "../../middlewares/validateRequest";
import { PromoController } from "./promo.controller";
import { createPromoZodSchema, updatePromoZodSchema } from "./promo.validaton";

const router = express.Router();

// Admin routes
router.post(
  "/",
  auth(USER_ROLES.ADMIN),
  fileUploadHandler(),
  validateRequest(createPromoZodSchema),
  PromoController.createPromo
);

router.patch(
  "/:id",
  auth(USER_ROLES.ADMIN),
  fileUploadHandler(),
  validateRequest(updatePromoZodSchema),
  PromoController.updatePromo
);

router.delete("/:id", auth(USER_ROLES.ADMIN), PromoController.deletePromo);
router.patch("/toggle/:id", auth(USER_ROLES.ADMIN), PromoController.togglePromoStatus);

// User routes
router.get("/", auth(USER_ROLES.USER, USER_ROLES.ADMIN), PromoController.getPromos);
router.get("/:id", auth(USER_ROLES.USER, USER_ROLES.ADMIN), PromoController.getSinglePromo);
router.post("/apply", auth(USER_ROLES.USER, USER_ROLES.ADMIN), PromoController.applyPromo);

export const PromoRoutes = router;
