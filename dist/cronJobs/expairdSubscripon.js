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
exports.expireSubscriptionsJob = void 0;
const notification_model_1 = require("../app/modules/notification/notification.model");
const subscription_model_1 = require("../app/modules/subscription/subscription.model");
const user_model_1 = require("../app/modules/user/user.model");
const user_1 = require("../enums/user");
const notificationsHelper_1 = require("../helpers/notificationsHelper");
const logger_1 = require("../shared/logger");
const expireSubscriptionsJob = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.logger.info("========== [CRON] START ==========");
        const now = new Date();
        console.log("🕒 Current Time (ISO):", now.toISOString());
        console.log("🕒 Current Time (Local):", now);
        // 🔍 Step 1: Find active subscriptions first
        const activeSubscriptions = yield subscription_model_1.Subscription.find({
            status: "active",
        }).select("_id user currentPeriodEnd");
        console.log(`📊 Total Active Subscriptions: ${activeSubscriptions.length}`);
        // 🔍 Step 2: Debug each subscription
        activeSubscriptions.forEach((sub, index) => {
            console.log(`\n🔎 Checking Subscription #${index + 1}`);
            console.log("👉 ID:", sub._id.toString());
            console.log("👉 User:", sub.user.toString());
            console.log("👉 currentPeriodEnd (raw):", sub.currentPeriodEnd);
            console.log("👉 Type:", typeof sub.currentPeriodEnd);
            // Convert to Date safely
            const endDate = new Date(sub.currentPeriodEnd);
            console.log("👉 Parsed End Date (ISO):", endDate.toISOString());
            console.log("👉 Parsed End Date (Local):", endDate);
            console.log("👉 Now > EndDate ?", now > endDate);
            if (isNaN(endDate.getTime())) {
                console.log("❌ Invalid Date detected!");
            }
        });
        // 🔍 Step 3: Actual query (with safety)
        const expiredSubscriptions = yield subscription_model_1.Subscription.find({
            status: "active",
            currentPeriodEnd: { $type: "date", $lt: now }, // 🔥 safe check
        }).select("_id user currentPeriodEnd");
        logger_1.logger.info(`📉 Found ${expiredSubscriptions.length} expired subscriptions`);
        if (!expiredSubscriptions.length) {
            logger_1.logger.info("[CRON] No subscriptions to expire");
            logger_1.logger.info("========== [CRON] END ==========");
            return;
        }
        console.log("\n🚨 Expiring these subscriptions:");
        expiredSubscriptions.forEach((sub, index) => {
            console.log(`❗ #${index + 1} ID: ${sub._id}`);
            console.log("   End Date:", sub.currentPeriodEnd);
        });
        // 🔹 Bulk update Subscriptions
        const subscriptionBulkOps = expiredSubscriptions.map((sub) => ({
            updateOne: {
                filter: { _id: sub._id },
                update: { $set: { status: "expired" } },
            },
        }));
        // 🔹 Bulk update Users
        const userBulkOps = expiredSubscriptions.map((sub) => ({
            updateOne: {
                filter: { _id: sub.user },
                update: {
                    $set: {
                        subscription: user_1.SUBSCRIPTION_STATUS.INACTIVE,
                        paymentStatus: "expired",
                    },
                },
            },
        }));
        if (subscriptionBulkOps.length) {
            console.log("🛠 Updating subscriptions...");
            yield subscription_model_1.Subscription.bulkWrite(subscriptionBulkOps);
        }
        if (userBulkOps.length) {
            console.log("🛠 Updating users...");
            yield user_model_1.User.bulkWrite(userBulkOps);
        }
        // 🔹 Send notifications
        const userIds = expiredSubscriptions.map((sub) => sub.user);
        console.log("📩 Sending notifications to users:", userIds);
        yield (0, notificationsHelper_1.sendNotification)({
            userIds,
            title: "Subscription expired",
            body: "Your subscription has expired. Please renew to continue enjoying our services.",
            type: notification_model_1.NotificationType.SYSTEM,
            channel: { socket: true, push: true },
        });
        logger_1.logger.info("[CRON] Expired subscription notifications sent");
        logger_1.logger.info("========== [CRON] END ==========");
    }
    catch (error) {
        logger_1.logger.error("❌ [CRON] Subscription expire check failed", error);
    }
});
exports.expireSubscriptionsJob = expireSubscriptionsJob;
