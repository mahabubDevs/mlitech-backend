import { Schema, model, Types } from "mongoose";

const groupMessageSchema = new Schema(
  {
    groupId: { type: Types.ObjectId, ref: "Group", required: true },
    senderId: { type: Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    images: [{ type: String }],
  },
  { timestamps: true }
);

export const GroupMessage = model("GroupMessage", groupMessageSchema);
