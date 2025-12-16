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
    Notification.find({ receiver: user.id })
      .select("type title message isRead createdAt referenceId")
      .sort("-createdAt"),
    query
  ).paginate();

  const [notifications, pagination, unreadCount] = await Promise.all([
    notificationQuery.modelQuery.lean().exec(),
    notificationQuery.getPaginationInfo(),
    Notification.countDocuments({ receiver: user.id, isRead: false }),
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
        filter: { receiver: user.id, isRead: false },
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
