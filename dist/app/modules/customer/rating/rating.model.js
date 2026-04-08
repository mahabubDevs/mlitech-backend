"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rating = void 0;
const mongoose_1 = require("mongoose");
const ratingSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    promotionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Promotion",
        required: true,
    },
    digitalCardId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "DigitalCard",
        required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
}, { timestamps: true });
exports.Rating = (0, mongoose_1.model)("Rating", ratingSchema);
