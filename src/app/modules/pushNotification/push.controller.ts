import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PushService } from "./push.service";
import { ICreatePush } from "./push.interface";
import { StatusCodes } from "http-status-codes";

const sendNotificationToAll = catchAsync(async (req: Request, res: Response) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Title and description required" });
    }

    const result = await PushService.sendNotificationToAllUsers(title, description);

   
    sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notification sent to all users",
  });
});

// const getAllPushes = catchAsync(async (req: Request, res: Response) => {
//   const result = await PushService.getAllPushesFromDB(req.query);

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Push notifications fetched successfully",
//     data: result.data,
//     pagination: result.pagination,
//   });
// });

export const PushController = { 
  sendNotificationToAll,
  //  getAllPushes 
  };
