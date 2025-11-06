import { Schema, model, Document } from "mongoose";

export interface IVideoCallAnalytics extends Document {
  userId: string;
  appVersion: string;
  qualityScore: number;
  bitrate: number;
  packetLoss: number;
  crashed: boolean;
  createdAt: Date;
}

const VideoCallAnalyticsSchema = new Schema<IVideoCallAnalytics>(
  {
    userId: { type: String, required: true },
    appVersion: { type: String, required: true },
    qualityScore: { type: Number, required: true },
    bitrate: { type: Number, required: true },
    packetLoss: { type: Number, required: true },
    crashed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const VideoCallAnalytics = model<IVideoCallAnalytics>(
  "VideoCallAnalytics",
  VideoCallAnalyticsSchema
);
