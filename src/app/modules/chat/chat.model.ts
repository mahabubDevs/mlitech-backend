import { Schema, model, Types } from "mongoose";

const chatSchema = new Schema(
  {
    roomId: { type: Types.ObjectId, ref: "Room", required: true },
    senderId: { type: Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    images: [{ type: String }],
    isRead: { type: Boolean, default: false },
    
  },
  { timestamps: true }
);

export const Chat = model("Chat", chatSchema);
