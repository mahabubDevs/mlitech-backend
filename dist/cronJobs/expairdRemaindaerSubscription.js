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
exports.expireReminderSubscriptionsJob = void 0;
const notification_model_1 = require("../app/modules/notification/notification.model");
const subscription_model_1 = require("../app/modules/subscription/subscription.model");
const notificationsHelper_1 = require("../helpers/notificationsHelper");
const expireReminderSubscriptionsJob = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        // Normalize today to midnight UTC
        const startOfToday = new Date(today);
        startOfToday.setUTCHours(0, 0, 0, 0);
        console.log("[CRON] Expire reminder job started at:", today.toISOString());
        console.log("[CRON] Start of today (UTC):", startOfToday.toISOString());
        const reminderDays = [30, 15, 7];
        // Fetch all active subscriptions
        const subscriptions = yield subscription_model_1.Subscription.find({ status: "active" }).select("user currentPeriodEnd");
        console.log(`[CRON] Total active subscriptions fetched: ${subscriptions.length}`);
        for (const sub of subscriptions) {
            const endDate = new Date(sub.currentPeriodEnd);
            // Calculate remaining days
            const remainingDays = Math.ceil((endDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`[CRON] Subscription ${sub._id} for user ${sub.user} ends at ${endDate.toISOString()}, remainingDays: ${remainingDays}`);
            if (!reminderDays.includes(remainingDays)) {
                console.log(`[CRON] Skipping subscription ${sub._id}, remainingDays ${remainingDays} not in [30,15,7]`);
                continue;
            }
            const title = `Your subscription expires in ${remainingDays} days`;
            const body = `Hello! Your subscription will expire in ${remainingDays} days. Please renew to continue enjoying our service.`;
            console.log(`[CRON] Sending ${remainingDays}-day reminder to user: ${sub.user}`);
            yield (0, notificationsHelper_1.sendNotification)({
                userIds: [sub.user],
                title,
                body,
                type: notification_model_1.NotificationType.MANUAL,
                channel: { socket: true, push: false },
            });
            console.log(`[CRON] Reminder sent for subscription ${sub._id}`);
        }
        console.log("[CRON] Expire reminder job finished at:", new Date().toISOString());
    }
    catch (error) {
        console.error("[CRON] Expire reminder error:", error);
    }
});
exports.expireReminderSubscriptionsJob = expireReminderSubscriptionsJob;
