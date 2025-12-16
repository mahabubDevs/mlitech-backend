import mongoose from "mongoose";
import { IRecentViewedPromotion } from "./recentViewedPromotion.interface";

const recentViewedPromotionSchema = new mongoose.Schema<IRecentViewedPromotion>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PromotionMercent",
      },
    ],
  },
  { timestamps: true }
);

export const RecentViewedPromotion = mongoose.model<IRecentViewedPromotion>(
  "RecentViewedPromotion",
  recentViewedPromotionSchema
);
