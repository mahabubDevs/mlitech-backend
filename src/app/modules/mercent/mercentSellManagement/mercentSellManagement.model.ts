import { Schema, model, Types } from "mongoose";
import { MerchantCustomer } from "../merchantCustomer/merchantCustomer.model";

const sellSchema = new Schema({
  merchantId: { type: Types.ObjectId, ref: "User", required: true },
  userId: { type: Types.ObjectId, ref: "User", required: true },
  digitalCardId: { type: Types.ObjectId, ref: "DigitalCardPromotin", required: true },
  promotionId: { type: Types.ObjectId, ref: "PromotionMercent", required: false },
  totalBill: { type: Number, required: true },
  discountedBill: { type: Number, required: true },
  pointsEarned: { type: Number, required: true },
  pointRedeemed: { type: Number, required: false },
  status: { type: String, enum: ["completed", "pending"], default: "pending" },
}, { timestamps: true });


sellSchema.post("save", async function (doc) {
  if (doc.status !== "completed") return;

  await MerchantCustomer.findOneAndUpdate(
    {
      merchantId: doc.merchantId,
      customerId: doc.userId,
    },
    {
      $inc: {
        totalSpend: doc.totalBill,
        totalOrders: 1,
        points: doc.pointsEarned || 0,
      },
      $set: {
        lastPurchaseAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
});

export const Sell = model("Sell", sellSchema);
