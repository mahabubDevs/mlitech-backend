"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesRep = void 0;
const mongoose_1 = require("mongoose");
const salesRepSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    packageId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Package",
        required: true,
    },
    salesRepName: {
        type: String,
    },
    salesRepReferralId: {
        type: String,
    },
    acknowledged: {
        type: Boolean,
        default: false,
    },
    acknowledgeDate: {
        type: Date,
    },
    token: {
        type: String,
    },
    tokenGenerateDate: {
        type: Date,
    },
    paymentStatus: {
        type: String,
        enum: ["paid", "unpaid", "expired"],
        default: "unpaid",
    },
    subscriptionStatus: {
        type: String,
        enum: ["active", "inActive"],
        default: "inActive",
    },
    subscriptionStatusChangedDate: {
        type: Date,
    },
    price: {
        type: Number,
    },
}, { timestamps: true });
exports.SalesRep = (0, mongoose_1.model)("SalesRep", salesRepSchema);
