import { Schema, model } from "mongoose";
import { IPromotion } from "./promotionMercent.interface";

const promotionSchema = new Schema(
  {
    // Auto-generated custom card id (8 characters)
    cardId: {
      type: String,
      unique: true,
    },

    // Promotion Name
    name: { type: String, required: true },

    // Customer Segment
    customerSegment: {
      type: String,
      required: true,
      enum: [
        "new_customer",
        "returning_customer",
        "loyal_customer",
        "vip_customer",
        "all_customer",
      ],
    },

    // Discount Percentage
    discountPercentage: { type: Number, required: true },

    // Promotion Type
    promotionType: {
      type: String,
      required: true,
      enum: ["seasonal", "referral", "flash_sale", "loyalty"],
    },

    // Date Range
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Promotion Days
    availableDays: {
      type: [
        {
          type: String,
          enum: ["all", "sun", "mon", "tue", "wed", "thu", "fri", "sat"],
        },
      ],
      default: ["all"],
    },

    // Image Upload
    image: { type: String },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    merchantId: {
    type: Schema.Types.ObjectId,
    ref: "User",   // merchant = user with merchant role
    required: true
  },
  },
  { timestamps: true }
);

export const Promotion = model<IPromotion>(
  "AdminPromotionMercent",
  promotionSchema
);
