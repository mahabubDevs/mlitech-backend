/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from "jsonwebtoken";
import { Notification, NotificationType } from "./notification.model";
import { FilterQuery } from "mongoose";

import { timeAgo } from "../../../util/timeAgo";
import QueryBuilder from "../../../util/queryBuilder";
import { sendNotification } from "../../../helpers/notificationsHelper";

const getUserNotificationFromDB = async (
  user: JwtPayload,
  query: FilterQuery<any>
) => {
  const notificationQuery = new QueryBuilder(
    Notification.find({ userId: user._id }).sort("-createdAt"),
    query
  ).paginate();

  const [notifications, pagination, unreadCount] = await Promise.all([
    notificationQuery.modelQuery.lean().exec(),
    notificationQuery.getPaginationInfo(),
    Notification.countDocuments({ userId: user._id, isRead: false }),
  ]);

  return {
    data: {
      notifications: notifications.map((notification: any) => {
        return {
          ...notification,
          timeAgo: timeAgo(notification.createdAt),
        };
      }),

      unreadCount,
    },
    pagination,
  };
};

const readUserNotificationToDB = async (user: JwtPayload): Promise<boolean> => {
  await Notification.bulkWrite([
    {
      updateMany: {
        filter: { userId: user._id, isRead: false },
        update: { $set: { isRead: true } },
        upsert: false,
      },
    },
  ]);

  return true;
};
const sendTestNotification = async (user: JwtPayload) => {
  await sendNotification({
    userIds: [user._id],
    title: "Test Notification",
    body: "This is a test notification.",
    type: NotificationType.SYSTEM,
  });
};

const sendSalesRepActiveTestNotification = async (user: JwtPayload) => {
  io.emit(`salesActivation::${user._id.toString()}`, {
    status: "active"
  });
};

export const NotificationService = {
  getUserNotificationFromDB,
  readUserNotificationToDB,
  sendTestNotification,
  sendSalesRepActiveTestNotification,
};
