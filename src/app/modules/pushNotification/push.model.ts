import { Schema, model, Types } from "mongoose";

const pushSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    state: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Push = model("Push", pushSchema);
