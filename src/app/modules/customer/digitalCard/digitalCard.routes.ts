import { Router } from "express";


import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import { DigitalCardController } from "./digitalCard.controller";
import { canAccessMerchantProfile } from "../../../middlewares/accessMerchentProfile";

const router = Router();

// router.post("/add", auth(), DigitalCardController.addPromotion);
router.post("/add", auth(USER_ROLES.USER), DigitalCardController.addPromotion);

router.get("/my-promotions", auth(USER_ROLES.USER), DigitalCardController.getUserAddedPromotions);
router.get("/my-digital-cards", auth(USER_ROLES.USER), DigitalCardController.getUserDigitalCards);
router.get(
  "/digital-card/:digitalCardId",
  auth(),
  DigitalCardController.getDigitalCardPromotions
);

// router.post(
//   "/user/approve-promotion",
//   auth(USER_ROLES.USER),
//   DigitalCardController.approvePromotion
// );



router.get(
  "/find",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN_MERCENT),canAccessMerchantProfile,
  DigitalCardController.getMerchantDigitalCard
);




export const DigitalCardRoutes = router;
