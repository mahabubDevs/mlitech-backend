import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { NotificationService } from "./notification.service";
import { JwtPayload } from "jsonwebtoken";

const getMyNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await NotificationService.getUserNotificationFromDB(
    user as JwtPayload,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Notification fetched successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

const readMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await NotificationService.readUserNotificationToDB(
    user as JwtPayload
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Notification read successfully",
    data: result,
  });
});

export const NotificationController = {
  getMyNotification,
  readMyNotifications,
};
