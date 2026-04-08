"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentViewedPromotion = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const recentViewedPromotionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "PromotionMercent",
        },
    ],
}, { timestamps: true });
exports.RecentViewedPromotion = mongoose_1.default.model("RecentViewedPromotion", recentViewedPromotionSchema);
