"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantCustomer = void 0;
const mongoose_1 = require("mongoose");
const merchantCustomerSchema = new mongoose_1.Schema({
    merchantId: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    customerId: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    totalSpend: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    isVip: { type: Boolean, default: false },
    lastPurchaseAt: { type: Date },
    points: { type: Number, default: 0 },
    segment: {
        type: String,
        enum: [
            "new_customer",
            "returning_customer",
            "loyal_customer",
            "vip_customer",
            "all_customer",
        ],
        default: "all_customer",
    }
}, { timestamps: true });
merchantCustomerSchema.index({ merchantId: 1, customerId: 1 }, { unique: true });
exports.MerchantCustomer = (0, mongoose_1.model)("MerchantCustomer", merchantCustomerSchema);
