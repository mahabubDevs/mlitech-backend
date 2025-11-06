import { Schema, model, Document } from "mongoose";

export interface IApiLog extends Document {
  endpoint: string;
  method: string;
  statusCode: number;
  createdAt: Date;
}

const ApiLogSchema = new Schema<IApiLog>(
  {
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ApiLog = model<IApiLog>("ApiLog", ApiLogSchema);
