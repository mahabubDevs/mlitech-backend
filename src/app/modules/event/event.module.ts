import { Schema, model, Types } from "mongoose";


const eventSchema = new Schema(
  {
    eventName: { type: String, required: true },
    eventType: { type: String, enum: ["Unlimited Ad Time","Unlimited Games","Unlimited Select City","Off APshop"], required: true },
    state: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    image: { type: String, default: null },
    selectedGame: { type: Types.ObjectId, ref: "Game", default: null },
    offAPPercentage: { type: Number, default: null },
    status: { type: String, enum: ["Active","Expired","Scheduled"], default: "Scheduled" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Event = model("Event", eventSchema);
