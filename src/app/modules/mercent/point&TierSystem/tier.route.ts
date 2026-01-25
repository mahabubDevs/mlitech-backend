import { Router } from "express";
import { TierController } from "./tier.controller";
import { USER_ROLES } from "../../../../enums/user";
import auth from "../../../middlewares/auth";
import { canAccessMerchantProfile } from "../../../middlewares/accessMerchentProfile";



const router = Router();

router.route("/")
  .get(auth(),canAccessMerchantProfile,  TierController.getTier)
  .post(auth(USER_ROLES.MERCENT,USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile, TierController.createTier);

router.route("/:id")
  .get(auth(USER_ROLES.VIEW_MERCENT,USER_ROLES.MERCENT,USER_ROLES.USER), TierController.getSingleTier)
  .patch(auth(USER_ROLES.MERCENT,USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile, TierController.updateTier)
  .delete(auth(USER_ROLES.MERCENT,USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile, TierController.deleteTier);

export const TierRoutes = router;
