"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shop = void 0;
// shop.model.ts
const mongoose_1 = require("mongoose");
const shopSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ["active", "block"],
        default: "active",
    },
    bundleType: {
        type: String,
        enum: ["call", "aura"],
        required: true,
    },
    callBundle: {
        enterTime: { type: Number }, // মিনিট/সেকেন্ড
        neededAura: { type: Number }, // ওই সময় কিনতে কত aura লাগবে
    },
    auraBundle: {
        auraNumber: { type: Number }, // কয়টা aura
        amount: { type: Number }, // কত টাকা
    },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
exports.Shop = (0, mongoose_1.model)("Shop", shopSchema);
