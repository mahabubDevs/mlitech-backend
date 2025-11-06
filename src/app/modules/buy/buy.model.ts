import mongoose, { Schema } from "mongoose";
import { IBuy } from "./buy.interface";

const BuySchema = new Schema<IBuy>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    packageId: { type: Schema.Types.ObjectId, ref: "CallBandle", required: true },
    minutesAdded: { type: Number, required: true },
    apSpent: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Buy = mongoose.model<IBuy>("Buy", BuySchema);
