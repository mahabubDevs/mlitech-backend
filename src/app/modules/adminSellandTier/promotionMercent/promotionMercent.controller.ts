import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { PromotionService } from "./promotionMercent.service";
import catchAsync from "../../../../shared/catchAsync";
import ApiError from "../../../../errors/ApiErrors";
import sendResponse from "../../../../shared/sendResponse";
import { IPromotion } from "./promotionMercent.interface";
import { JwtPayload } from "jsonwebtoken";
import { Promotion } from "./promotionMercent.model";

const createPromotion = catchAsync(async (req: Request, res: Response) => {
  // body data parse
  const bodyData = req.body.data ? JSON.parse(req.body.data) : {};

  const {
    name,
    discountPercentage,
    promotionType,
    customerSegment,
    startDate,
    availableDays,
    endDate,
  } = bodyData;

  if (!name || !customerSegment || !promotionType) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Required fields missing");
  }

  // IMAGE URL
  let imageUrl: string | undefined = undefined;
  if (req.files && (req.files as any).image && (req.files as any).image[0]) {
    const file = (req.files as any).image[0];
    const fileName = file.filename;
    imageUrl = `/images/${fileName}`;
  }

  // MERCHANT ID from request.user (auth middleware sets req.user)
  const merchantId = (req.user as any)?._id;
  if (!merchantId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Merchant ID not found");
  }

  const payload: Partial<IPromotion> = {
    name,
    discountPercentage: Number(discountPercentage),
    promotionType,
    customerSegment,
    startDate: new Date(startDate),
    availableDays,
    endDate: new Date(endDate),
    image: imageUrl,
    merchantId, // ✅ save merchantId in DB
  };

  const result = await PromotionService.createPromotionToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotion created successfully",
    data: result,
  });
});

const getAllPromotions = catchAsync(async (req: Request, res: Response) => {
  const result = await PromotionService.getAllPromotionsFromDB(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotions retrieved successfully",
    data: result.promotions,
    pagination: result.pagination,
  });
});
const getAllPromotionsOfAMerchant = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await PromotionService.getAllPromotionsOfAMerchant(
      user._id,
      req.query
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Promotions retrieved successfully",
      data: result.promotions,
      pagination: result.pagination,
    });
  }
);

const getPromotionsForUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID not found");
  }

  const userSegment = await PromotionService.getUserSegment(userId);

  const promotions = await Promotion.find({
    customerSegment: { $in: [userSegment, "all_customer"] },
    status: "active"
  }).populate("merchantId", "website name");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotions retrieved successfully for user",
    data: promotions,
  });
});


const getSinglePromotion = catchAsync(async (req: Request, res: Response) => {
  const result = await PromotionService.getSinglePromotionFromDB(req.params.id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Promotion not found");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotion retrieved successfully",
    data: result,
  });
});

const updatePromotion = catchAsync(async (req: Request, res: Response) => {
  const bodyData = req.body.data ? JSON.parse(req.body.data) : { ...req.body };

  const payload: Partial<any> = {
    ...(bodyData.name && { name: bodyData.name }),
    ...(bodyData.discountPercentage && {
      discountPercentage: Number(bodyData.discountPercentage),
    }),
    ...(bodyData.promotionType && { promotionType: bodyData.promotionType }),
    ...(bodyData.customerSegment && {
      customerSegment: bodyData.customerSegment,
    }),
    ...(bodyData.startDate && { startDate: new Date(bodyData.startDate) }),
    ...(bodyData.endDate && { endDate: new Date(bodyData.endDate) }),
    ...(bodyData.availableDays && {
      availableDays: Array.isArray(bodyData.availableDays)
        ? bodyData.availableDays
        : [bodyData.availableDays],
    }),
  };

  // ✅ Fix Image URL Format (same as create)
  if (req.files && (req.files as any).image && (req.files as any).image[0]) {
    const file = (req.files as any).image[0];
    const fileName = file.filename;
    payload.image = `/images/${fileName}`;
  }

  const result = await PromotionService.updatePromotionToDB(
    req.params.id,
    payload
  );

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
    data: result,
  });
});

const togglePromotion = catchAsync(async (req: Request, res: Response) => {
  const result = await PromotionService.togglePromotionInDB(req.params.id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Promotion not found");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Promotion toggled successfully`,
    data: result,
  });
});

const getPopularMerchants = catchAsync(async (req: Request, res: Response) => {
  const result = await PromotionService.getPopularMerchantsFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Popular merchants fetched successfully",
    data: result,
  });
});
const getDetailsOfMerchant = catchAsync(async (req: Request, res: Response) => {
  const result = await PromotionService.getDetailsOfMerchant(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchants details fetched successfully",
    data: result,
  });
});
const getUserTierOfMerchant = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await PromotionService.getUserTierOfMerchant(
      user._id,
      req.body.merchantId
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User Tier of Merchant fetched successfully",
      data: result,
    });
  }
);

//catagory show pro

const getPromotionsByUserCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { categoryName } = req.query; // user sends ?categoryName=restaurant

    const promotions = await PromotionService.getPromotionsByUserCategory(
      String(categoryName)
    );

    res.status(200).json({
      success: true,
      message: "Promotions fetched successfully",
      data: promotions,
    });
  }
);

export const PromotionController = {
  createPromotion,
  getAllPromotions,
  getSinglePromotion,
  updatePromotion,
  deletePromotion,
  togglePromotion,
  getPopularMerchants,
  getDetailsOfMerchant,
  getUserTierOfMerchant,
  getPromotionsByUserCategory,

  getPromotionsForUser,

  getAllPromotionsOfAMerchant,

};
