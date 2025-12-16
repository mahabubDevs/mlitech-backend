import mongoose from "mongoose";
import { INotification } from "../app/modules/notification/notification.interface";
import { Notification } from "../app/modules/notification/notification.model";

export const sendNotifications = async (
  data: INotification,
  session?: mongoose.ClientSession
): Promise<INotification> => {
  const result = await Notification.create([data], { session });
  const createdNotification = result[0];

  const socketIo = global.io;

  if (socketIo) {
    socketIo.emit(`get-notification::${data?.receiver}`, createdNotification);
  }

  return createdNotification;
};
