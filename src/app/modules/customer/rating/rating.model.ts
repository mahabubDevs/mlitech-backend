import { Schema, model } from "mongoose";
import { IRating } from "./rating.interface";
import { Types } from "mongoose";

const ratingSchema = new Schema<IRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    promotionId: {
      type: Schema.Types.ObjectId,
      ref: "Promotion",
      required: true,
    },
    digitalCardId: {
      type: Schema.Types.ObjectId,
      ref: "DigitalCard",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Rating = model<IRating>("Rating", ratingSchema);
