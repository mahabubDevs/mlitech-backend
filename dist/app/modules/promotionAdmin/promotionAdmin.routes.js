"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const promotionAdmin_controller_1 = require("./promotionAdmin.controller");
const fileUploaderHandler_1 = __importDefault(require("../../middlewares/fileUploaderHandler"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: "uploads/" }); // image upload
router.post("/", (0, fileUploaderHandler_1.default)(), 
// validateRequest(createPromotionSchema),
promotionAdmin_controller_1.PromotionController.createPromotion);
router.get("/", promotionAdmin_controller_1.PromotionController.getAllPromotions);
router.get("/:id", promotionAdmin_controller_1.PromotionController.getSinglePromotion);
// routes/promo.routes.ts
router.patch("/:id", (0, fileUploaderHandler_1.default)(), // createPromotion এর মতো middleware
//   validateRequest(updatePromotionSchema), // optional: partial validation
promotionAdmin_controller_1.PromotionController.updatePromotion);
router.delete("/:id", promotionAdmin_controller_1.PromotionController.deletePromotion);
router.patch("/toggle/:id", promotionAdmin_controller_1.PromotionController.togglePromotion);
exports.PromoRoutes = router;
