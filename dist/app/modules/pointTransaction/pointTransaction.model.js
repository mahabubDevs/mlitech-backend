"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const pointTransactionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["EARN", "REDEEM"],
        required: true,
    },
    source: {
        type: String,
        enum: ["REFERRAL", "SUBSCRIPTION", "ADMIN"],
        required: true,
    },
    referral: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Referral",
        default: null,
    },
    points: {
        type: Number,
        required: true,
    },
    note: String,
}, { timestamps: true });
const PointTransaction = (0, mongoose_1.model)("PointTransaction", pointTransactionSchema);
exports.default = PointTransaction;
