"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const user_model_1 = require("../app/modules/user/user.model");
const notification_model_1 = require("../app/modules/notification/notification.model");
const sendNotification = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userIds, title, body, type, metadata, attachments, channel = { socket: true, push: false }, }) {
    if (!(userIds === null || userIds === void 0 ? void 0 : userIds.length))
        return [];
    // 1. Create notifications
    const notifications = yield notification_model_1.Notification.insertMany(userIds.map((userId) => ({
        userId,
        title,
        body,
        type,
        metadata,
        attachments,
        channel,
    })), { ordered: false });
    // 2. Emit exact saved notification data
    if (channel.socket) {
        const users = yield user_model_1.User.find({ _id: { $in: userIds } }).select("_id socketIds");
        const notificationMap = new Map();
        notifications.forEach((n) => {
            const key = n.userId.toString();
            if (!notificationMap.has(key))
                notificationMap.set(key, []);
            notificationMap.get(key).push(n);
        });
        users.forEach((user) => {
            var _a;
            const userNotifications = notificationMap.get(user._id.toString());
            if (!(userNotifications === null || userNotifications === void 0 ? void 0 : userNotifications.length))
                return;
            (_a = user.socketIds) === null || _a === void 0 ? void 0 : _a.forEach((socketId) => {
                userNotifications.forEach((notification) => {
                    io.to(socketId).emit("newNotification", notification);
                });
            });
        });
    }
    // 3. Push notifications (future)
    if (channel.push) {
        // FCM / APNS
    }
    return notifications;
});
exports.sendNotification = sendNotification;
