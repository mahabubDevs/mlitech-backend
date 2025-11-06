import { Schema, model, Types } from "mongoose";

const gameSchema = new Schema(
  {
    gameTitle: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Game = model("Game", gameSchema);
