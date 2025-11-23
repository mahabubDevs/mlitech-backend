import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";

import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { PromotionService } from "./promotionMercent.service";


const createPromotion = catchAsync(async (req: Request, res: Response) => {
    // data field থেকে JSON parse করো
    const bodyData = req.body.data ? JSON.parse(req.body.data) : {};
console.log("REQ.BODY:", req.body);
    console.log("REQ.FILES:", req.files);
    const {
        name,
 
        discountPercentage,
        promotionType,
        customerSegment,
        startDate,
         availableDays,
        endDate,
    } = bodyData;

    if (!name || !customerSegment) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Name and Customer Segment are required");
    }

    const payload: Partial<any> = {
        name,
        discountPercentage: Number(discountPercentage),
        promotionType,
        customerSegment,
        startDate: new Date(startDate),
         availableDays,
        endDate: new Date(endDate),
        image: req.files && (req.files as any).image ? (req.files as any).image[0].path : undefined,
        createdBy: (req.user as any)?._id,
    };

    const result = await PromotionService.createPromotionToDB(payload);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Promotion created successfully",
        data: result
    });
});


const getAllPromotions = catchAsync(async (req: Request, res: Response) => {
    const result = await PromotionService.getAllPromotionsFromDB();
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Promotions retrieved successfully",
        data: result
    });
});

const getSinglePromotion = catchAsync(async (req: Request, res: Response) => {
    const result = await PromotionService.getSinglePromotionFromDB(req.params.id);
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Promotion not found");
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Promotion retrieved successfully",
        data: result
    });
});

const updatePromotion = catchAsync(async (req: Request, res: Response) => {
  // 🔹 Step 1: Parse data (support both form-data JSON string & raw JSON)
  const bodyData = req.body.data ? JSON.parse(req.body.data) : { ...req.body };

  // 🔹 Step 2: Convert numeric & date fields properly
  const payload: Partial<any> = {
    ...(bodyData.name && { name: bodyData.name }),
    ...(bodyData.customerReach && { customerReach: Number(bodyData.customerReach) }),
    ...(bodyData.discountPercentage && { discountPercentage: Number(bodyData.discountPercentage) }),
    ...(bodyData.promotionType && { promotionType: bodyData.promotionType }),
    ...(bodyData.customerSegment && { customerSegment: bodyData.customerSegment }),
    ...(bodyData.startDate && { startDate: new Date(bodyData.startDate) }),
    ...(bodyData.endDate && { endDate: new Date(bodyData.endDate) }),
    ...(bodyData.availableDays && {
      availableDays: Array.isArray(bodyData.availableDays)
        ? bodyData.availableDays
        : [bodyData.availableDays],
    }),
  };

  // 🔹 Step 3: Handle uploaded image (if provided)
  if (req.files && (req.files as any).image) {
    payload.image = (req.files as any).image[0].path; // relative path
  }

  // 🔹 Step 4: Update document
  const result = await PromotionService.updatePromotionToDB(req.params.id, payload);

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Promotion not found");
  }

  // 🔹 Step 5: Send response
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotion updated successfully",
    data: result,
  });
});


const deletePromotion = catchAsync(async (req: Request, res: Response) => {
    const result = await PromotionService.deletePromotionFromDB(req.params.id);
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Promotion not found");

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Promotion deleted successfully",
        data: result
    });
});

const togglePromotion = catchAsync(async (req: Request, res: Response) => {
    const result = await PromotionService.togglePromotionInDB(req.params.id);
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Promotion not found");

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Promotion ${result.isActive ? "activated" : "deactivated"} successfully`,
        data: result
    });
});

export const PromotionController = {
    createPromotion,
    getAllPromotions,
    getSinglePromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion
};
