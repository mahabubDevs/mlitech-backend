import { Router } from "express";
import multer from "multer";

import { PromotionController } from "./promotionMercent.controller";
import fileUploadHandler from "../../../middlewares/fileUploaderHandler";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";

const router = Router();

router.get("/popular-merchants", PromotionController.getPopularMerchants);

router.post(
  "/",
  auth(USER_ROLES.MERCENT),
  fileUploadHandler(),
  PromotionController.createPromotion
);

router.get("/", auth(), PromotionController.getAllPromotions);

router.get("/:id", auth(), PromotionController.getSinglePromotion);

router.patch(
  "/:id",
  auth(USER_ROLES.MERCENT),
  fileUploadHandler(),
  PromotionController.updatePromotion
);

router.delete(
  "/:id",
  auth(USER_ROLES.MERCENT),
  PromotionController.deletePromotion
);

router.patch(
  "/toggle/:id",
  auth(USER_ROLES.MERCENT),
  PromotionController.togglePromotion
);

export const PromoMercentRoutes = router;
