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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_model_1 = require("./notification.model");
const timeAgo_1 = require("../../../util/timeAgo");
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const notificationsHelper_1 = require("../../../helpers/notificationsHelper");
const getUserNotificationFromDB = (user, query) => __awaiter(void 0, void 0, void 0, function* () {
    const notificationQuery = new queryBuilder_1.default(notification_model_1.Notification.find({ userId: user._id }).sort("-createdAt"), query).paginate();
    const [notifications, pagination, unreadCount] = yield Promise.all([
        notificationQuery.modelQuery.lean().exec(),
        notificationQuery.getPaginationInfo(),
        notification_model_1.Notification.countDocuments({ userId: user._id, isRead: false }),
    ]);
    return {
        data: {
            notifications: notifications.map((notification) => {
                return Object.assign(Object.assign({}, notification), { timeAgo: (0, timeAgo_1.timeAgo)(notification.createdAt) });
            }),
            unreadCount,
        },
        pagination,
    };
});
const readUserNotificationToDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    yield notification_model_1.Notification.bulkWrite([
        {
            updateMany: {
                filter: { userId: user._id, isRead: false },
                update: { $set: { isRead: true } },
                upsert: false,
            },
        },
    ]);
    return true;
});
const sendTestNotification = (user) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: [user._id],
        title: "Test Notification",
        body: "This is a test notification.",
        type: notification_model_1.NotificationType.SYSTEM,
    });
});
const sendSalesRepActiveTestNotification = (user) => __awaiter(void 0, void 0, void 0, function* () {
    io.emit(`salesActivation::${user._id.toString()}`, {
        status: "active"
    });
});
exports.NotificationService = {
    getUserNotificationFromDB,
    readUserNotificationToDB,
    sendTestNotification,
    sendSalesRepActiveTestNotification,
};
