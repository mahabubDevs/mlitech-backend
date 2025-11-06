import { Schema, model, Types } from "mongoose";

const promoSchema = new Schema(
  {
    promoCode: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ["Percentage Discount","Fixed Amount Discount","Free Ap","Aura+Trail Day's"], required: true },
    value: { type: Number, required: true },
    usageLimit: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Promo = model("Promo", promoSchema);
