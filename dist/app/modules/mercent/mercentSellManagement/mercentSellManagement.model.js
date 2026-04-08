"use strict";
// import { Schema, model, Types } from "mongoose";
// import { MerchantCustomer } from "../merchantCustomer/merchantCustomer.model";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sell = void 0;
// const sellSchema = new Schema({
//   merchantId: { type: Types.ObjectId, ref: "User", required: true },
//   userId: { type: Types.ObjectId, ref: "User", required: true },
//   digitalCardId: { type: Types.ObjectId, ref: "DigitalCardPromotin", required: true },
//   promotionId: { type: Types.ObjectId, ref: "PromotionMercent", required: false },
//   totalBill: { type: Number, required: true },
//   discountedBill: { type: Number, required: true },
//   pointsEarned: { type: Number, required: true },
//   pointRedeemed: { type: Number, required: false },
//   status: { type: String, enum: ["completed", "pending","rejected"], default: "pending" },
// }, { timestamps: true });
// sellSchema.post("save", async function (doc) {
//   if (doc.status !== "completed") return;
//   await MerchantCustomer.findOneAndUpdate(
//     {
//       merchantId: doc.merchantId,
//       customerId: doc.userId,
//     },
//     {
//       $inc: {
//         totalSpend: doc.totalBill,
//         totalOrders: 1,
//         points: doc.pointsEarned || 0,
//       },
//       $set: {
//         lastPurchaseAt: new Date(),
//       },
//     },
//     { upsert: true, new: true }
//   );
// });
// export const Sell = model("Sell", sellSchema);
const mongoose_1 = require("mongoose");
const merchantCustomer_model_1 = require("../merchantCustomer/merchantCustomer.model");
const sellSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    userId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    digitalCardId: { type: mongoose_1.Types.ObjectId, ref: "DigitalCardPromotin", required: true },
    promotionIds: [
        {
            type: mongoose_1.Types.ObjectId,
            ref: "PromotionMercent",
        }
    ],
    totalBill: { type: Number, required: true },
    discountedBill: { type: Number, required: true },
    pointsEarned: { type: Number, required: true },
    pointRedeemed: { type: Number, required: false },
    status: { type: String, enum: ["completed", "pending", "rejected", "expired"], default: "pending" },
    approvalExpiresAt: {
        type: Date,
    },
}, { timestamps: true });
// ======= Post-save hook =======
sellSchema.post("save", function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (doc.status !== "completed")
            return;
        // 1️⃣ Update MerchantCustomer stats
        const updatedCustomer = yield merchantCustomer_model_1.MerchantCustomer.findOneAndUpdate({
            merchantId: doc.merchantId,
            customerId: doc.userId,
        }, {
            $inc: {
                totalSpend: doc.totalBill,
                totalOrders: 1,
                points: doc.pointsEarned || 0,
            },
            $set: {
                lastPurchaseAt: new Date(),
            },
        }, { upsert: true, new: true });
        // 2️⃣ Recalculate segment
        if (updatedCustomer) {
            const { totalOrders, totalSpend } = updatedCustomer;
            // Timeframes
            const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
            const twelveMonthsAgo = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
            // Last 6 months purchases
            const last6MonthsPurchases = yield (0, mongoose_1.model)("Sell").find({
                merchantId: doc.merchantId,
                userId: doc.userId,
                status: "completed",
                createdAt: { $gte: sixMonthsAgo },
            }).countDocuments();
            // Last 12 months spend
            const last12MonthsSpend = yield (0, mongoose_1.model)("Sell").find({
                merchantId: doc.merchantId,
                userId: doc.userId,
                status: "completed",
                createdAt: { $gte: twelveMonthsAgo },
            }).then(sells => sells.reduce((sum, s) => sum + s.totalBill, 0));
            const avgSpend = 10000; // Default average spend
            let segment;
            // ----------------------
            // 1️⃣ VIP Customer
            // ----------------------
            if (last6MonthsPurchases >= 20 || last12MonthsSpend >= 3 * avgSpend) {
                segment = "vip_customer";
            }
            // ----------------------
            // 2️⃣ Loyal Customer
            // ----------------------
            else if (last6MonthsPurchases >= 5 ||
                totalOrders >= 3 || // Approximate 3 consecutive months of activity
                totalSpend >= 1.5 * avgSpend) {
                segment = "loyal_customer";
            }
            // ----------------------
            // 3️⃣ Returning Customer
            // ----------------------
            else if (totalOrders >= 2 && last6MonthsPurchases < 5) {
                segment = "returning_customer";
            }
            // ----------------------
            // 4️⃣ New Customer
            // ----------------------
            else {
                segment = "new_customer";
            }
            updatedCustomer.segment = segment;
            yield updatedCustomer.save();
        }
    });
});
exports.Sell = (0, mongoose_1.model)("Sell", sellSchema);
