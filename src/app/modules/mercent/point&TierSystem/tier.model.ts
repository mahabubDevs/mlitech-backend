import { Schema, model } from "mongoose";
import { ITier } from "./tier.interface";


const tierSchema = new Schema<ITier>(
  {
    name: { type: String, required: true, trim: true },
    pointsThreshold: { type: Number, required: true, min: 0 },
    reward: { type: String, required: true },
    accumulationRule: { type: String, required: true },
    redemptionRule: { type: String, required: true },
    minTotalSpend: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
  } as any,
  { timestamps: true }
);

export const Tier = model<ITier>("Tier", tierSchema);
