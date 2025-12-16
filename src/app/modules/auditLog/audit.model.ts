import { Schema, model } from "mongoose";

export interface IAuditLog {
  actionType: string;
  user: string; // username বা userId
  details: string;
  timestamp?: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  actionType: { type: String, required: true },
  user: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
