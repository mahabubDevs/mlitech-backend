import { Model, Types } from "mongoose";
import { NOTIFICATION_TYPE } from "./notification.constants";

export interface INotification {
  type: NOTIFICATION_TYPE;
  title: string;
  message: string;
  receiver: Types.ObjectId;
  referenceId?: string;
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationModel = Model<INotification>;
