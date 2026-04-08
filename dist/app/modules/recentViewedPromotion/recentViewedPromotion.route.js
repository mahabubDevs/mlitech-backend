"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentViewedPromotionRoutes = void 0;
// role.routes.ts
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const recentViewedPromotion_controller_1 = require("./recentViewedPromotion.controller");
const router = express_1.default.Router();
router.post("/", (0, auth_1.default)(), recentViewedPromotion_controller_1.RecentViewedPromotionController.addRecentViewed);
router.get("/", (0, auth_1.default)(), recentViewedPromotion_controller_1.RecentViewedPromotionController.getRecentViewed);
exports.RecentViewedPromotionRoutes = router;
