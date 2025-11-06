// shop.model.ts
import { Schema, model, Types } from "mongoose";

const shopSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["active", "block"],
      default: "active",
    },
    bundleType: {
      type: String,
      enum: ["call", "aura"],
      required: true,
    },
    callBundle: {
      enterTime: { type: Number },   // মিনিট/সেকেন্ড
      neededAura: { type: Number },  // ওই সময় কিনতে কত aura লাগবে
    },
    auraBundle: {
      auraNumber: { type: Number },  // কয়টা aura
      amount: { type: Number },      // কত টাকা
    },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Shop = model("Shop", shopSchema);
