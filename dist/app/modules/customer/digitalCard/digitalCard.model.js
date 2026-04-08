"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalCard = void 0;
const mongoose_1 = require("mongoose");
const digitalCardSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    merchantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // Unique auto-generated card code per merchant+user
    cardCode: {
        type: String,
        unique: true,
        required: true,
    },
    availablePoints: {
        type: Number,
        default: 0,
    },
    lifeTimeEarnPoints: {
        type: Number,
        default: 0,
    },
    hasReceivedFirstReward: {
        type: Boolean,
        default: false,
    },
    tier: { type: String, default: null },
    // Promotion tracking with status
    promotions: [
        {
            promotionId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "PromotionMercent",
            },
            status: {
                type: String,
                enum: ["unused", "used", "expired", "pending"],
                default: "pending",
            },
            usedAt: {
                type: Date,
            },
            promoCode: {
                type: String,
                // unique: true, // optional (but recommended)
                //  sparse: true,
            },
        },
    ],
    // List of promotions saved by user
    // promotions: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "PromotionMercent",
    //   },
    // ],
}, { timestamps: true });
exports.DigitalCard = (0, mongoose_1.model)("DigitalCardPromotin", digitalCardSchema);
