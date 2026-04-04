 // আগের তোমার তৈরি ফাইল

import { NotificationType } from "../app/modules/notification/notification.model";
import { Subscription } from "../app/modules/subscription/subscription.model";
import { sendNotification } from "../helpers/notificationsHelper";

export const expireReminderSubscriptionsJob = async () => {
  const today = new Date();

  // Active subscriptions
  const subscriptions = await Subscription.find({ status: "active" });

  // Reminder for 30, 15, 7 days
  const reminderDays = [30, 15, 7];

  for (const subscription of subscriptions) {
    const daysLeft = Math.ceil(
      (((subscription as any).endDate as Date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!reminderDays.includes(daysLeft)) continue;

    const title = `Your subscription expires in ${daysLeft} days`;
    const body = `Hello! Your subscription will expire in ${daysLeft} days. Please renew to continue enjoying our service.`;

    await sendNotification({
      userIds: [subscription.user],
      title,
      body,
      type: NotificationType.MANUAL, // তোমার NotificationType অনুযায়ী
      channel: { socket: true, push: false }, // push enable করতে পারো
    });
  }
};