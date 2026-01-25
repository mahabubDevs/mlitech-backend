import { Router } from "express";
import multer from "multer";

import { PromotionController } from "./promotionMercent.controller";
import fileUploadHandler from "../../../middlewares/fileUploaderHandler";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";

import { PromotionValidations } from "./promotionMercent.validation";
import validateRequest from "../../../middlewares/validateRequest";
import { canAccessMerchantProfile } from "../../../middlewares/accessMerchentProfile";

const router = Router();

router.get("/popular-merchants", PromotionController.getPopularMerchants);
// catagory routes can be added here in future

router.get(
  "/by-category",
  auth(),
  PromotionController.getPromotionsByUserCategory
);

router.get("/merchants/:id", auth(), PromotionController.getDetailsOfMerchant);
router.get(
  "/merchants",
  auth(USER_ROLES.MERCENT, USER_ROLES.VIEW_MERCENT, USER_ROLES.ADMIN_MERCENT), canAccessMerchantProfile,
  PromotionController.getAllPromotionsOfAMerchant
);
router.get(
  "/users/tier",
  auth(),
  validateRequest(PromotionValidations.getUserTierOfMerchantZodSchema),
  PromotionController.getUserTierOfMerchant
);

router.post(
  "/",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile,
  fileUploadHandler(),
  PromotionController.createPromotion
);

router.get("/", auth(), PromotionController.getAllPromotions);

//logit add for all user promotion fetching

router.get(
  "/user-promotions",
  auth(),
  PromotionController.getPromotionsForUser
);
router.get(
  "/user-combine-promotions",
  auth(),
  PromotionController.getCombinePromotionsForUser
);

router.get("/:id", auth(), PromotionController.getSinglePromotion);

router.patch(
  "/:id",
  auth(USER_ROLES.MERCENT,USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile,
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
router.post("/send-notification", auth(USER_ROLES.MERCENT), fileUploadHandler(), validateRequest(PromotionValidations.sendNotificationToCustomerZodSchema), PromotionController.sendNotificationToCustomer);

export const PromoMercentRoutes = router;
