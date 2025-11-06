
import mongoose, { Schema } from "mongoose";
import { ICallBundle } from "./callBundle.interface";


const CallBandleSchema = new Schema<ICallBundle>(
  {
    totaltime: { type: String, required: true },
    totalap: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    

  },
  { timestamps: true }
);

export const CallBandle = mongoose.model<ICallBundle>("CallBandle", CallBandleSchema);
