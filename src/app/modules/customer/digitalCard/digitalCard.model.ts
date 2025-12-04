import { Schema, model } from "mongoose";

const digitalCardSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Unique auto-generated card code per merchant+user
    cardCode: {
      type: String,
      unique: true,
      required: true,
    },
    availablePoints: {
      type: Number,
      default: 0,
    },

// Promotion tracking with status
    promotions: [
      {
        promotionId: {
          type: Schema.Types.ObjectId,
          ref: "PromotionMercent",
        },
        status: {
          type: String,
          enum: ["unused", "used", "expired","pending"],
          default: "pending",
        },
        usedAt: {
          type: Date,
        },
      },
    ],
    
    // List of promotions saved by user
    // promotions: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "PromotionMercent",
    //   },
    // ],
  },
  { timestamps: true }
);

export const DigitalCard = model("DigitalCardPromotin", digitalCardSchema);
