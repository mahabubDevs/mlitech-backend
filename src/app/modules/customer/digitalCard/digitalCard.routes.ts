import { Router } from "express";


import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import { DigitalCardController } from "./digitalCard.controller";

const router = Router();

router.post("/add", auth(), DigitalCardController.addPromotion);
router.get("/my-promotions", auth(), DigitalCardController.getUserAddedPromotions);
router.get("/my-digital-cards", auth(), DigitalCardController.getUserDigitalCards);
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
  auth(USER_ROLES.MERCENT),
  DigitalCardController.getMerchantDigitalCard
);




export const DigitalCardRoutes = router;
