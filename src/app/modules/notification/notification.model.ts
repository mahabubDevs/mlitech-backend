import { model, Schema } from "mongoose";
import { INotification, NotificationModel } from "./notification.interface";
import { NOTIFICATION_TYPE } from "./notification.constants";

const notificationSchema = new Schema<INotification, NotificationModel>(
  {
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referenceId: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification, NotificationModel>(
  "Notification",
  notificationSchema
);
