"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoMercentRoutes = void 0;
const express_1 = require("express");
const promotionMercent_controller_1 = require("./promotionMercent.controller");
const fileUploaderHandler_1 = __importDefault(require("../../../middlewares/fileUploaderHandler"));
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const user_1 = require("../../../../enums/user");
const promotionMercent_validation_1 = require("./promotionMercent.validation");
const validateRequest_1 = __importDefault(require("../../../middlewares/validateRequest"));
const accessMerchentProfile_1 = require("../../../middlewares/accessMerchentProfile");
const router = (0, express_1.Router)();
router.get("/popular-merchants", promotionMercent_controller_1.PromotionController.getPopularMerchants);
// catagory routes can be added here in future
router.get("/by-category", (0, auth_1.default)(), promotionMercent_controller_1.PromotionController.getPromotionsByUserCategory);
router.get("/merchants/:id", (0, auth_1.default)(), promotionMercent_controller_1.PromotionController.getDetailsOfMerchant);
router.get("/merchants", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, promotionMercent_controller_1.PromotionController.getAllPromotionsOfAMerchant);
router.get("/users/tier", (0, auth_1.default)(), (0, validateRequest_1.default)(promotionMercent_validation_1.PromotionValidations.getUserTierOfMerchantZodSchema), promotionMercent_controller_1.PromotionController.getUserTierOfMerchant);
router.post("/", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, (0, fileUploaderHandler_1.default)(), promotionMercent_controller_1.PromotionController.createPromotion);
router.get("/", (0, auth_1.default)(), promotionMercent_controller_1.PromotionController.getAllPromotions);
//logit add for all user promotion fetching
// router.get(
//   "/user-promotions",
//   auth(),
//   PromotionController.getPromotionsForUser
// );
router.get("/user-combine-promotions", (0, auth_1.default)(), promotionMercent_controller_1.PromotionController.getCombinePromotionsForUser);
router.get("/:id", (0, auth_1.default)(), promotionMercent_controller_1.PromotionController.getSinglePromotion);
router.patch("/:id", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, (0, fileUploaderHandler_1.default)(), promotionMercent_controller_1.PromotionController.updatePromotion);
router.delete("/:id", (0, auth_1.default)(user_1.USER_ROLES.MERCENT), promotionMercent_controller_1.PromotionController.deletePromotion);
router.patch("/toggle/:id", (0, auth_1.default)(user_1.USER_ROLES.MERCENT), promotionMercent_controller_1.PromotionController.togglePromotion);
router.post("/send-notification", (0, auth_1.default)(user_1.USER_ROLES.MERCENT), (0, fileUploaderHandler_1.default)(), (0, validateRequest_1.default)(promotionMercent_validation_1.PromotionValidations.sendNotificationToCustomerZodSchema), promotionMercent_controller_1.PromotionController.sendNotificationToCustomer);
exports.PromoMercentRoutes = router;
