"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const shop_controller_1 = require("./shop.controller");
const router = express_1.default.Router();
// Admin routes
router.post("/", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), shop_controller_1.ShopController.createShop);
router.patch("/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), shop_controller_1.ShopController.updateShop);
router.delete("/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), shop_controller_1.ShopController.deleteShop);
router.patch("/toggle/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), shop_controller_1.ShopController.toggleShopStatus);
// User + Admin routes
router.get("/", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN), shop_controller_1.ShopController.getShops);
router.get("/:id", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN), shop_controller_1.ShopController.getSingleShop);
exports.ShopRoutes = router;
