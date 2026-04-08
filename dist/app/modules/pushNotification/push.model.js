"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Push = void 0;
const mongoose_1 = require("mongoose");
const pushSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    state: { type: String, },
    country: { type: String },
    city: { type: String }, // নতুন ফিল্ড
    tier: { type: String },
    subscriptionType: { type: String },
    status: { type: String },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    mediaUrl: { type: String },
}, { timestamps: true });
exports.Push = (0, mongoose_1.model)("Push", pushSchema);
