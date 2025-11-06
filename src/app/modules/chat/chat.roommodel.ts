import { Schema, model, Types } from "mongoose";

const roomSchema = new Schema(
  {
    senderId: { type: Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Types.ObjectId, ref: "User", required: true },
    lastMessage: { type: Types.ObjectId, ref: "Chat" }, // ✅ add this
  },
  { timestamps: true }
);

export const Room = model("Room", roomSchema);
