import { Schema, model, Document, Types } from "mongoose";

export interface IGiftCard extends Document {
  title: string;
  code: string;
  merchantId: Types.ObjectId;
  userId?: Types.ObjectId | null;       // buyer (optional for merchant-created giftcards)
  tierId?: Types.ObjectId | null;       // optional, specific tier member জন্য
  digitalCardId?: Types.ObjectId | null;
  points: number;                    // optional, tier or custom discount %
  isActive: boolean;
  expiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const giftCardSchema = new Schema<IGiftCard>({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  merchantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  tierId: { type: Schema.Types.ObjectId, ref: "Tier", default: null }, // new field
  digitalCardId: { type: Schema.Types.ObjectId, ref: "DigitalCard", default: null },
  points: { type: Number, default: 0 },
  // discount: { type: Number, default: null }, // new field for discount %
  isActive: { type: Boolean, default: true },
  expiry: { type: Date, default: null },
}, { timestamps: true });

export const GiftCard = model<IGiftCard>("GiftCard", giftCardSchema);
