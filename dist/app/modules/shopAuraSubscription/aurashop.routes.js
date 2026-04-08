"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AurashopRoute = void 0;
// src/routes/package.routes.ts
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const aurashop_controller_1 = require("./aurashop.controller");
const router = (0, express_1.Router)();
// router.post("/", auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), AuraSubscriptionController.createPackage);
router.get("/", (0, auth_1.default)(), aurashop_controller_1.AuraSubscriptionController.getAllPackages);
router.patch("/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), aurashop_controller_1.AuraSubscriptionController.updatePackage);
router.delete("/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), aurashop_controller_1.AuraSubscriptionController.deletePackage);
router.patch("/toggle/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), aurashop_controller_1.AuraSubscriptionController.togglePackage);
router.get("/:id", (0, auth_1.default)(), aurashop_controller_1.AuraSubscriptionController.getSinglePackage);
exports.AurashopRoute = router;
