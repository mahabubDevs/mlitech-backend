import express from "express";
import { GiftCardController } from "./giftCard.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

// User buys gift card
router.post("/buy", auth(USER_ROLES.USER, USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.buyGiftCard);

// Find digital card by unique ID
router.get("/digital", auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.findByUniqueId);

// Get all gift cards under a digital card
router.get("/digital/:digitalId/giftcards", auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.getGiftCardsByDigital);

// Admin / Merchant gift card CRUD
router.post("/", auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.createGiftCard);
router.get("/:id", auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.getGiftCard);
router.patch("/:id", auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.updateGiftCard);
router.delete("/:id", auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN), GiftCardController.deleteGiftCard);

export const GiftCardRoute = router;
