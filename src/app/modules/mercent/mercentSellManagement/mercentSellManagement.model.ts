import { Schema, model, Types } from "mongoose";

const sellSchema = new Schema({
  merchantId: { type: Types.ObjectId, ref: "User", required: true },
  userId: { type: Types.ObjectId, ref: "User", required: true },
  digitalCardId: { type: Types.ObjectId, ref: "DigitalCardPromotin", required: true },
  promotionId: { type: Types.ObjectId, ref: "PromotionMercent", required: false },
  totalBill: { type: Number, required: true },
  discountedBill: { type: Number, required: true },
  pointsEarned: { type: Number, required: true },
  pointRedeemed: { type: Number, required: false },
  status: { type: String, enum: ["completed", "pending"], default: "pending" },
}, { timestamps: true });

export const Sell = model("Sell", sellSchema);
