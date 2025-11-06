import { Schema, model, Types } from "mongoose";

const matchingSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true }, // যিনি action করছেন
    targetUserId: { type: Types.ObjectId, ref: "User", required: true }, // যাকে action করছে
    status: {
      type: String,
      enum: ["PASSED", "CALLED", "LIKED", "PENDING", "MATCHED"],
      default: "CALLED",
    },
    callRoomId: { type: Types.ObjectId, ref: "CallRoom", default: null }, // call/chat room জন্য
  },
  { timestamps: true }
);

export const Matching = model("Matching", matchingSchema);
