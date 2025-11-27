  import { Schema, model, Document, Types } from "mongoose";
  
  export interface IPointsHistory extends Document {
  digitalCardId: Types.ObjectId;
  points: number;
  type: "earn" | "redeem";
  description?: string;
  createdAt: Date;
}
  // pointsHistory.model.ts
const pointsHistorySchema = new Schema<IPointsHistory>({
  digitalCardId: { type: Schema.Types.ObjectId, ref: "DigitalCard", required: true },
  points: { type: Number, required: true },
  type: { type: String, enum: ["earn", "redeem"], required: true },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const PointsHistory = model("PointsHistory", pointsHistorySchema);
