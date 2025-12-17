/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from "jsonwebtoken";
import { Notification } from "./notification.model";
import { FilterQuery } from "mongoose";

import { timeAgo } from "../../../util/timeAgo";
import QueryBuilder from "../../../util/queryBuilder";

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

export const NotificationService = {
  getUserNotificationFromDB,
  readUserNotificationToDB,
};
