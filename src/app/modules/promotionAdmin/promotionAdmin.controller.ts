import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";

import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { PromotionService } from "./promotionAdmin.service";

const createPromotion = catchAsync(async (req: Request, res: Response) => {
    // data field থেকে JSON parse করো
    const bodyData = req.body.data ? JSON.parse(req.body.data) : {};
console.log("REQ.BODY:", req.body);
    console.log("REQ.FILES:", req.files);
    const {
        name,
        customerReach,
        discountPercentage,
        promotionType,
        customerSegment,
        startDate,
        endDate,
    } = bodyData;

    if (!name || !customerSegment) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Name and Customer Segment are required");
    }

    const payload: Partial<any> = {
        name,
        customerReach: Number(customerReach),
        discountPercentage: Number(discountPercentage),
        promotionType,
        customerSegment,
        startDate: new Date(startDate),
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
  // data field থেকে parse করা (Option A: JSON string) 
  const bodyData = req.body.data ? JSON.parse(req.body.data) : { ...req.body };

  // যদি image upload করা হয়ে থাকে
  if (req.files && (req.files as any).image) {
    bodyData.image = (req.files as any).image[0].path; // relative path
  }

  const result = await PromotionService.updatePromotionToDB(req.params.id, bodyData);
  
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Promotion not found");
  }

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
