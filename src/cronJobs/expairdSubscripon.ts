
import { NotificationType } from "../app/modules/notification/notification.model";
import { Subscription } from "../app/modules/subscription/subscription.model";
import { User } from "../app/modules/user/user.model";
import { SUBSCRIPTION_STATUS } from "../enums/user";
import { sendNotification } from "../helpers/notificationsHelper";
import { logger } from "../shared/logger";

export const expireSubscriptionsJob = async () => {
  try {
    logger.info("[CRON] Subscription expire check started");

    const now = new Date();

    // 🔍 Find expired subscriptions (status active and past end date)
    const expiredSubscriptions = await Subscription.find({
      status: "active",
      currentPeriodEnd: { $lt: now }, // Date object দিয়ে compare
    }).select("_id user currentPeriodEnd"); // শুধু প্রয়োজনীয় ফিল্ড

    logger.info(`[CRON] Found ${expiredSubscriptions.length} expired subscriptions`);

    if (!expiredSubscriptions.length) {
      logger.info("[CRON] No subscriptions to expire");
      return;
    }

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
            subscription: SUBSCRIPTION_STATUS.INACTIVE,
            paymentStatus: "expired",
          },
        },
      },
    }));

    if (subscriptionBulkOps.length) await Subscription.bulkWrite(subscriptionBulkOps);
    if (userBulkOps.length) await User.bulkWrite(userBulkOps);

    // 🔹 Send notifications
    const userIds = expiredSubscriptions.map((sub) => sub.user);
    await sendNotification({
      userIds,
      title: "Subscription expired",
      body: "Your subscription has expired. Please renew to continue enjoying our services.",
      type: NotificationType.SYSTEM,
      channel: { socket: true, push: true },
    });

    logger.info("[CRON] Expired subscription notifications sent");
  } catch (error) {
    logger.error("[CRON] Subscription expire check failed", error);
  }
};