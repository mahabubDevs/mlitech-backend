import { Schema, model, Document } from "mongoose";

export interface IServerHealth extends Document {
  uptimePercentage: string;
  load: string;
  memoryUsed: string;
  uptimeSeconds: number;
  lastIncident: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServerHealthSchema = new Schema<IServerHealth>(
  {
    uptimePercentage: { type: String, required: true },
    load: { type: String, required: true },
    memoryUsed: { type: String, required: true },
    uptimeSeconds: { type: Number, required: true },
    lastIncident: { type: String, required: true },
  },
  { timestamps: true }
);

export const ServerHealth = model<IServerHealth>(
  "ServerHealth",
  ServerHealthSchema
);
