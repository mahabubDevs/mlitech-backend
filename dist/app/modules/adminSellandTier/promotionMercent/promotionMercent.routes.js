"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPromoMercentRoutes = void 0;
const express_1 = require("express");
const promotionMercent_controller_1 = require("./promotionMercent.controller");
const fileUploaderHandler_1 = __importDefault(require("../../../middlewares/fileUploaderHandler"));
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const user_1 = require("../../../../enums/user");
const router = (0, express_1.Router)();
// router.get("/popular-merchants", PromotionController.getPopularMerchants);
// catagory routes can be added here in future
// router.get(
//   "/by-category",
//   auth(),
//   PromotionController.getPromotionsByUserCategory
// );
// router.get("/merchants/:id", PromotionController.getDetailsOfMerchant);
// router.get(
//   "/merchants",
//   auth(USER_ROLES.MERCENT),
//   PromotionController.getAllPromotionsOfAMerchant
// );
// router.get(
//   "/users/tier",
//   auth(),
//   validateRequest(PromotionValidations.getUserTierOfMerchantZodSchema),
//   PromotionController.getUserTierOfMerchant
// );
router.post("/", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, fileUploaderHandler_1.default)(), promotionMercent_controller_1.PromotionController.createPromotion);
router.get("/", (0, auth_1.default)(), promotionMercent_controller_1.PromotionController.getAllPromotions);
//logit add for all user promotion fetching
router.get("/user-promotions", (0, auth_1.default)(), promotionMercent_controller_1.PromotionController.getPromotionsForUser);
router.get("/:id", (0, auth_1.default)(), promotionMercent_controller_1.PromotionController.getSinglePromotion);
router.patch("/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, fileUploaderHandler_1.default)(), promotionMercent_controller_1.PromotionController.updatePromotion);
router.delete("/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), promotionMercent_controller_1.PromotionController.deletePromotion);
router.patch("/toggle/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), promotionMercent_controller_1.PromotionController.togglePromotion);
exports.AdminPromoMercentRoutes = router;
