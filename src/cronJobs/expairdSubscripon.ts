
import { NotificationType } from "../app/modules/notification/notification.model";
import { Subscription } from "../app/modules/subscription/subscription.model";
import { User } from "../app/modules/user/user.model";
import { SUBSCRIPTION_STATUS } from "../enums/user";
import { sendNotification } from "../helpers/notificationsHelper";
import { logger } from "../shared/logger";

export const expireSubscriptionsJob = async () => {
  try {
    logger.info("========== [CRON] START ==========");

    const now = new Date();
    console.log("🕒 Current Time (ISO):", now.toISOString());
    console.log("🕒 Current Time (Local):", now);

    // 🔍 Step 1: Find active subscriptions first
    const activeSubscriptions = await Subscription.find({
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
    const expiredSubscriptions = await Subscription.find({
      status: "active",
      currentPeriodEnd: { $type: "date", $lt: now }, // 🔥 safe check
    }).select("_id user currentPeriodEnd");

    logger.info(`📉 Found ${expiredSubscriptions.length} expired subscriptions`);

    if (!expiredSubscriptions.length) {
      logger.info("[CRON] No subscriptions to expire");
      logger.info("========== [CRON] END ==========");
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
            subscription: SUBSCRIPTION_STATUS.INACTIVE,
            paymentStatus: "expired",
          },
        },
      },
    }));

    if (subscriptionBulkOps.length) {
      console.log("🛠 Updating subscriptions...");
      await Subscription.bulkWrite(subscriptionBulkOps);
    }

    if (userBulkOps.length) {
      console.log("🛠 Updating users...");
      await User.bulkWrite(userBulkOps);
    }

    // 🔹 Send notifications
    const userIds = expiredSubscriptions.map((sub) => sub.user);
    console.log("📩 Sending notifications to users:", userIds);

    await sendNotification({
      userIds,
      title: "Subscription expired",
      body: "Your subscription has expired. Please renew to continue enjoying our services.",
      type: NotificationType.SYSTEM,
      channel: { socket: true, push: true },
    });

    logger.info("[CRON] Expired subscription notifications sent");
    logger.info("========== [CRON] END ==========");
  } catch (error) {
    logger.error("❌ [CRON] Subscription expire check failed", error);
  }
};