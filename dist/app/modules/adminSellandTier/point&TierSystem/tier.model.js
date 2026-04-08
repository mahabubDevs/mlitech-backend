"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tier = void 0;
const mongoose_1 = require("mongoose");
const tierSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    pointsThreshold: { type: Number, required: true, min: 0 },
    reward: { type: String, required: true },
    accumulationRule: { type: Number, required: true },
    redemptionRule: { type: Number, required: true },
    minTotalSpend: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    admin: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
exports.Tier = (0, mongoose_1.model)("AdminTier", tierSchema);
