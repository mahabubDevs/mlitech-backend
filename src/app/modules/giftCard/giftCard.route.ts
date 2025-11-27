import express from "express";
import { GiftCardController } from "./giftCard.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import validateRequest from "../../middlewares/validateRequest";
import { createGiftCardSchema } from "./iftCard.validation";

const router = express.Router();

// User buys gift card
router.post("/buy", auth(), GiftCardController.buyGiftCard);
router.get("/my-giftcards", auth(USER_ROLES.USER), GiftCardController.getAllUserGiftCards);

// Find digital card by unique ID
router.get("/digital", auth(USER_ROLES.MERCENT), GiftCardController.findByUniqueId);

// Get all gift cards under a digital card
router.get("/digital/:digitalId/giftcards", auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.getGiftCardsByDigital);

// List all digital cards for a user 

router.get(
  "/digital/list",
  auth(),
  GiftCardController.listAllDigitalCards
);








// Admin / Merchant gift card CRUD
router.post(
  "/",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(createGiftCardSchema),
  GiftCardController.createGiftCard
);

router.get("/", auth(), GiftCardController.getAllGiftCard);
router.get("/:id", auth(), GiftCardController.getGiftCard);
router.patch("/:id", auth(USER_ROLES.MERCENT,), GiftCardController.updateGiftCard);
router.delete("/:id", auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.deleteGiftCard);

export const GiftCardRoute = router;
