import { NotificationType } from "../app/modules/notification/notification.model";
import { Subscription } from "../app/modules/subscription/subscription.model";
import { sendNotification } from "../helpers/notificationsHelper";

export const expireReminderSubscriptionsJob = async () => {
  try {
    const today = new Date();
    // Normalize today to midnight UTC
    const startOfToday = new Date(today);
    startOfToday.setUTCHours(0, 0, 0, 0);

    console.log("[CRON] Expire reminder job started at:", today.toISOString());
    console.log("[CRON] Start of today (UTC):", startOfToday.toISOString());

    const reminderDays = [30, 15, 7];

    // Fetch all active subscriptions
    const subscriptions = await Subscription.find({ status: "active" }).select("user currentPeriodEnd");
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

      await sendNotification({
        userIds: [sub.user],
        title,
        body,
        type: NotificationType.MANUAL,
        channel: { socket: true, push: false },
      });

      console.log(`[CRON] Reminder sent for subscription ${sub._id}`);
    }

    console.log("[CRON] Expire reminder job finished at:", new Date().toISOString());
  } catch (error) {
    console.error("[CRON] Expire reminder error:", error);
  }
};