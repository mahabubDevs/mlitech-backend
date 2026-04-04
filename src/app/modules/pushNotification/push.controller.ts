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
  console.log("📌 Request Body raw:", req.body);
  console.log("📌 Uploaded Files:", req.files);

  // 🔹 Base URL
  // const baseUrl = `${req.protocol}://${req.get("host")}`;
  const baseUrl = "https://hz2w208g-5004.inc1.devtunnels.ms";
  console.log("🌐 Base URL:", baseUrl);

  // Parse JSON data
  const payloadData = req.body.data ? JSON.parse(req.body.data) : {};
  console.log("📝 Parsed payloadData:", payloadData);

  // Image: uploaded file overrides body link
  const image =
  req.files && (req.files as any).image
    ? `${baseUrl}/images/${(req.files as any).image[0].filename}`  
    : payloadData.image?.replace(/^\/uploads/, ""); 

  console.log("🖼 Image URL to send:", image);

  // FRONTEND LAT/LNG
  let merchantLocation = null;
  if (payloadData.lat !== undefined && payloadData.lng !== undefined) {
    merchantLocation = {
      type: "Point",
      coordinates: [Number(payloadData.lng), Number(payloadData.lat)],
    };
    console.log("📍 Merchant Location:", merchantLocation);
  }

  const payload = {
    title: payloadData.title || "Promotion",
    message: payloadData.message,
    image,
    target: { type: "points" },
    filters: {
      minPoints: payloadData.minPoints ? Number(payloadData.minPoints) : 0,
      segment: payloadData.segment ?? "all_customer",
      radius: payloadData.radius ? Number(payloadData.radius) : Infinity,
      merchantLocation,
    },
    state: payloadData.state,
    country: payloadData.country,
    city: payloadData.city,
    tier: payloadData.tier,
    subscriptionType: payloadData.subscriptionType,
  };

  console.log("📌 Final Payload for PushService:", payload);

  const result = await PushService.sendMerchantPromotion(payload, merchantId);

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
