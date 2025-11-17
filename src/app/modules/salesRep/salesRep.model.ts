import { model, Schema } from "mongoose";
import { ISalesRep, SalesRepModel } from "./salesRep.interface";

const salesRepSchema = new Schema<ISalesRep, SalesRepModel>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgeDate: {
      type: Date,
    },
    token: {
      type: String,
    },
    tokenGenerateDate: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "expired"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

export const SalesRep = model<ISalesRep, SalesRepModel>(
  "SalesRep",
  salesRepSchema
);
