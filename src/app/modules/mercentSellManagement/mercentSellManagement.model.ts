// merchantSellManagement.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  merchantId?: Types.ObjectId;
  customerId: Types.ObjectId;
  totalBill: number;
  redeemedPoints: number;
  usedGiftCard?: Types.ObjectId;
  giftCardDeducted?: number;
  earnedPoints: number;
  finalAmount: number;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "User" },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalBill: { type: Number, required: true },
    redeemedPoints: { type: Number, default: 0 },
    usedGiftCard: { type: Schema.Types.ObjectId, ref: "GiftCard", default: null },
    giftCardDeducted: { type: Number, default: 0 },
    earnedPoints: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);
