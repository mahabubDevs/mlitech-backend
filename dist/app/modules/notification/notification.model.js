"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationType = void 0;
const mongoose_1 = require("mongoose");
var NotificationType;
(function (NotificationType) {
    NotificationType["SYSTEM"] = "system";
    NotificationType["POLICY"] = "policy";
    NotificationType["POINTS"] = "points";
    NotificationType["PAYMENT"] = "payment";
    NotificationType["REFERRAL"] = "referral";
    NotificationType["PROMOTION"] = "promotion";
    NotificationType["WELCOME"] = "welcome";
    NotificationType["DELETION"] = "deletion";
    NotificationType["MANUAL"] = "manual";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        required: true,
    },
    isRead: { type: Boolean, default: false },
    attachments: [{ type: String }],
    channel: {
        socket: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
    },
}, { timestamps: true });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
