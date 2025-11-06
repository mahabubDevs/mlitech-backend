import { Router } from "express";
import { BuyController } from "./buy.controller";
import auth from "../../middlewares/auth";

const router = Router();

// User buys CallBundle (AP)
router.post("/", auth(), BuyController.buyPackage);

// Optionally, get user's purchase history
router.get("/history", auth(), BuyController.getUserPurchases);

export const BuyCall = router;
