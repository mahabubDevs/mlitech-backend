import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { ShopController } from "./shop.controller";

const router = express.Router();

// Admin routes
router.post("/", auth(USER_ROLES.ADMIN), ShopController.createShop);
router.patch("/:id", auth(USER_ROLES.ADMIN), ShopController.updateShop);
router.delete("/:id", auth(USER_ROLES.ADMIN), ShopController.deleteShop);
router.patch("/toggle/:id", auth(USER_ROLES.ADMIN), ShopController.toggleShopStatus);

// User + Admin routes
router.get("/", auth(USER_ROLES.USER, USER_ROLES.ADMIN), ShopController.getShops);
router.get("/:id", auth(USER_ROLES.USER, USER_ROLES.ADMIN), ShopController.getSingleShop);

export const ShopRoutes = router;
