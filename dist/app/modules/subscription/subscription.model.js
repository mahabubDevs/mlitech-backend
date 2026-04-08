"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const subscriptionSchema = new mongoose_1.Schema({
    customerId: {
        type: String,
        required: function () {
            // online/salesRep ছাড়া অন্য source হলে optional
            return this.source === "online" || this.source === "salesRep";
        },
    },
    price: {
        type: Number,
        required: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    package: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Package",
        required: true,
    },
    trxId: {
        type: String,
        required: function () {
            return this.price > 0;
        },
    },
    subscriptionId: { type: String, unique: true, required: true },
    currentPeriodStart: {
        type: String,
        required: true,
    },
    currentPeriodEnd: {
        type: String,
        required: true,
    },
    remaining: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["expired", "active", "cancel"],
        default: "active",
        required: true,
    },
    source: {
        type: String,
        enum: ["online", "salesRep", "free", "manual"], // ✅ manual add
        default: "online",
    },
}, {
    timestamps: true,
});
exports.Subscription = (0, mongoose_1.model)("Subscription", subscriptionSchema);
