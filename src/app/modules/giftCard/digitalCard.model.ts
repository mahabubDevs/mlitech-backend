import { Schema, model, Document, Types } from "mongoose";

export interface IDigitalCard extends Document {
  userId: Types.ObjectId;
  merchantId: Types.ObjectId;
  uniqueId: string;          // visible to merchant (scanable)
  totalPoints: number;
  tierId?: Types.ObjectId | null;         // optional, tier-specific card
  isActive: boolean;                      // card status
  expiry?: Date | null;                   // optional card expiry
  pointsHistory?: {
    points: number;
    type: "earn" | "redeem";
    description?: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const digitalCardSchema = new Schema<IDigitalCard>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  merchantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uniqueId: { type: String, required: true, unique: true },
  totalPoints: { type: Number, default: 0 },
  tierId: { type: Schema.Types.ObjectId, ref: "Tier", default: null }, // optional tier
  isActive: { type: Boolean, default: true },                          // card active status
  expiry: { type: Date, default: null },                                // optional expiry
  pointsHistory: [
    {
      points: { type: Number, required: true },
      type: { type: String, enum: ["earn", "redeem"], required: true },
      description: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export const DigitalCard = model<IDigitalCard>("DigitalCard", digitalCardSchema);
