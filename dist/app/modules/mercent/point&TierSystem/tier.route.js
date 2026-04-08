"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TierRoutes = void 0;
const express_1 = require("express");
const tier_controller_1 = require("./tier.controller");
const user_1 = require("../../../../enums/user");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const accessMerchentProfile_1 = require("../../../middlewares/accessMerchentProfile");
const router = (0, express_1.Router)();
router.route("/")
    .get((0, auth_1.default)(), accessMerchentProfile_1.canAccessMerchantProfile, tier_controller_1.TierController.getTier)
    .post((0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, tier_controller_1.TierController.createTier);
router.route("/:id")
    .get((0, auth_1.default)(user_1.USER_ROLES.VIEW_MERCENT, user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.USER), tier_controller_1.TierController.getSingleTier)
    .patch((0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, tier_controller_1.TierController.updateTier)
    .delete((0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), accessMerchentProfile_1.canAccessMerchantProfile, tier_controller_1.TierController.deleteTier);
router.route("/merchant/:userId")
    .get(tier_controller_1.TierController.getTierByUserId);
exports.TierRoutes = router;
