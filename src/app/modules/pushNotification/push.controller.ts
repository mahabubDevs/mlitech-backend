import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PushService } from "./push.service";
import { ICreatePush } from "./push.interface";
import { StatusCodes } from "http-status-codes";



const sendNotificationToAll = catchAsync(async (req, res) => {
  console.log("Request Body:", req.body);
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



const sendMerchantPromotion = catchAsync(async (req: Request, res: Response) => {
  const merchant = req.user as any;
  const merchantId = merchant._id;

  console.log("📌 Merchant ID:", merchantId);
  console.log("📌 Request Body:", req.body);
  console.log("📌 Uploaded Files:", req.files);

  // Parse JSON data
  const payloadData = req.body.data ? JSON.parse(req.body.data) : {};

  // Image: uploaded file overrides body link
  const image =
    req.files && (req.files as any).image
      ? (req.files as any).image[0].path
      : payloadData.image;

  // 🔥 FRONTEND LAT/LNG (instead of merchant profile location)
  let merchantLocation = null;

  if (
    payloadData.lat !== undefined &&
    payloadData.lng !== undefined
  ) {
    merchantLocation = {
      type: "Point",
      coordinates: [
        Number(payloadData.lng),
        Number(payloadData.lat),
      ], // GeoJSON format [lng, lat]
    };
  }

  const payload = {
    message: payloadData.message,
    image,
    target: { type: "points" },
    filters: {
      minPoints:
        payloadData.minPoints !== undefined
          ? Number(payloadData.minPoints)
          : 0,
      segment: payloadData.segment ?? "all_customer",
      radius:
        payloadData.radius !== undefined
          ? Number(payloadData.radius)
          : Infinity,
      merchantLocation,
    },
  };

  console.log("📌 Final Payload for PushService:", payload);

  const result = await PushService.sendMerchantPromotion(
    payload,
    merchantId
  );

  console.log("✅ Notification Result:", result);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Promotion notification sent successfully",
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
  sendMerchantPromotion
  //  getAllPushes 
  };
