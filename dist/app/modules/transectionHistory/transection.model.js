"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionHistory = exports.POINT_TRANSACTION_TYPE = void 0;
// src/app/modules/points/point.model.ts
const mongoose_1 = require("mongoose");
var POINT_TRANSACTION_TYPE;
(function (POINT_TRANSACTION_TYPE) {
    POINT_TRANSACTION_TYPE["EARN"] = "EARN";
    POINT_TRANSACTION_TYPE["USE"] = "USE";
})(POINT_TRANSACTION_TYPE || (exports.POINT_TRANSACTION_TYPE = POINT_TRANSACTION_TYPE = {}));
const pointTransactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(POINT_TRANSACTION_TYPE), required: true },
    points: { type: Number, required: true },
    source: { type: String, required: true },
    subscriptionId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Subscription" },
    balanceAfter: { type: Number, required: true },
}, { timestamps: true });
pointTransactionSchema.index({ userId: 1, createdAt: -1 });
exports.TransactionHistory = (0, mongoose_1.model)("TransactionHistory", pointTransactionSchema);
