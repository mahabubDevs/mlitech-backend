"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const mongoose_1 = require("mongoose");
const packageSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, enum: ['1 month', '4 months', '8 months', '1 year'], required: true },
    paymentType: { type: String, enum: ['Monthly', 'Yearly'], required: false },
    features: [{ type: String, required: true }],
    productId: { type: String, required: true },
    priceId: { type: String, required: true },
    loginLimit: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Delete'], default: 'Active' },
    payoutAccountId: { type: String },
    admin: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    isFreeTrial: { type: Boolean, default: false },
    priceIdWithPoints: { type: Object, default: {} } // <-- UPDATED
}, { timestamps: true });
exports.Package = (0, mongoose_1.model)("Package", packageSchema);
