"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplyRequest = void 0;
const mongoose_1 = require("mongoose");
const ApplyRequestSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    giftCardId: { type: mongoose_1.Schema.Types.ObjectId, ref: "GiftCard", required: true },
    billAmount: { type: Number, required: true },
    pointsToRedeem: { type: Number, required: true },
    pointsEarned: { type: Number, default: 0 },
    remainingBill: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "denied", "merchant_confirmed"],
        default: "pending",
    },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
exports.ApplyRequest = (0, mongoose_1.model)("ApplyRequest", ApplyRequestSchema);
