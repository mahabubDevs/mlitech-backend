"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalCardRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const user_1 = require("../../../../enums/user");
const digitalCard_controller_1 = require("./digitalCard.controller");
const accessMerchentProfile_1 = require("../../../middlewares/accessMerchentProfile");
const router = (0, express_1.Router)();
// router.post("/add", auth(), DigitalCardController.addPromotion);
router.post("/add", (0, auth_1.default)(user_1.USER_ROLES.USER), digitalCard_controller_1.DigitalCardController.addPromotion);
router.post("/create-digital-card", (0, auth_1.default)(user_1.USER_ROLES.USER), digitalCard_controller_1.DigitalCardController.createOrGetUserDigitalCard);
router.get("/my-promotions", (0, auth_1.default)(user_1.USER_ROLES.USER), digitalCard_controller_1.DigitalCardController.getUserAddedPromotions);
router.get("/my-digital-cards", (0, auth_1.default)(user_1.USER_ROLES.USER), digitalCard_controller_1.DigitalCardController.getUserDigitalCards);
router.get("/digital-card/:digitalCardId", (0, auth_1.default)(), digitalCard_controller_1.DigitalCardController.getDigitalCardPromotions);
// router.post(
//   "/user/approve-promotion",
//   auth(USER_ROLES.USER),
//   DigitalCardController.approvePromotion
// );
router.get("/find", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, digitalCard_controller_1.DigitalCardController.getMerchantDigitalCard);
exports.DigitalCardRoutes = router;
