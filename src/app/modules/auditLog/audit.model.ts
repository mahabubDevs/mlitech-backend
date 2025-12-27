import { Schema, model, Types } from "mongoose";

export interface IAuditLog {
  actionType: string;
  user?: Types.ObjectId;   // ✅ ObjectId
  details: string;
  timestamp?: Date;
  email?: string | null;
}

const auditLogSchema = new Schema<IAuditLog>({
  actionType: { type: String, required: true },

  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,       // ✅ optional
  },

  details: { type: String, required: true },

  email: { type: String, default: null },

  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
