import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PushService } from "./push.service";
import { ICreatePush } from "./push.interface";
import { StatusCodes } from "http-status-codes";



const sendNotificationToAll = catchAsync(async (req, res) => {
  const result = await PushService.sendNotificationToAllUsers(
    req.body,
    (req.user as any)?._id
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Notification sent successfully",
    data: result,
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
