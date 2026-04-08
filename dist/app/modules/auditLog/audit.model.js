"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const auditLogSchema = new mongoose_1.Schema({
    actionType: { type: String, required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
    details: { type: String, required: true },
    email: { type: String, default: null },
}, { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);
exports.AuditLog = (0, mongoose_1.model)("AuditLog", auditLogSchema);
