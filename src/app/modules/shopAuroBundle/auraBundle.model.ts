
import mongoose, { Schema } from "mongoose";
import { IAuraBundle } from "./auraBundle.interface";


const AuraBandleSchema = new Schema<IAuraBundle>(
  {
    totalap: { type: Number, required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    

  },
  { timestamps: true }
);

export const AuraBandle = mongoose.model<IAuraBundle>("AuraBandle", AuraBandleSchema);
