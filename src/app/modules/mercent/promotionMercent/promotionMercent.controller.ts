import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { PromotionService } from "./promotionMercent.service";
import catchAsync from "../../../../shared/catchAsync";
import ApiError from "../../../../errors/ApiErrors";
import sendResponse from "../../../../shared/sendResponse";
import { IPromotion } from "./promotionMercent.interface";
import { JwtPayload } from "jsonwebtoken";
import { Promotion } from "./promotionMercent.model";
import { sendNotification } from "../../../../helpers/notificationsHelper";
import { NotificationType } from "../../notification/notification.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";

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
    merchantId,
  };

  const result = await PromotionService.createPromotionToDB(payload);

  if (result) {
    await sendNotification({
      userIds: [result.merchantId],
      title: "Congratulations! promotion published",
      body: `Your promotion "${name}" has been published successfully`,
      type: NotificationType.PROMOTION,
    })
  }
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

  // 1️⃣ Determine user segment
  const userSegment = await PromotionService.getUserSegment(userId);

  // 2️⃣ Today's date & day
  const today = new Date();
  const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayDay = dayMap[today.getDay()];

  // 3️⃣ Fetch promotions that match user segment or all_customer
  let promotions = await Promotion.find({
    customerSegment: { $in: [userSegment, "all_customer"] },
    status: "active"
  }).populate("merchantId", "website name");


    // 4️⃣ Fetch user's digital cards
  const digitalCards = await DigitalCard.find({ userId }).select("promotions");

  // 5️⃣ Collect all promotionIds user already has
// Collect all promotionIds user already has safely
const existingPromotionIds = digitalCards.flatMap(card =>
  card.promotions
    .map(p => p.promotionId?.toString()) // ❗ optional chaining
    .filter(Boolean) as string[]          // ❗ null/undefined remove
);



  // 4️⃣ Filter promotions by valid date and available days
// 6️⃣ Filter promotions by valid date, available days, and not already in user's cards
promotions = promotions.filter(promo => {
  const startDate = new Date(promo.startDate);
  const endDate = new Date(promo.endDate);

  const isValidDate = today >= startDate && today <= endDate;

  const days = promo.availableDays || [];
  const isValidDay = days.includes("all") || days.includes(todayDay);

  const isNotInUserCard = !existingPromotionIds.includes(promo._id.toString());

  return isValidDate && isValidDay && isNotInUserCard;
});


  // 5️⃣ Send response
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
  const userId = (req.user as any)?._id; // logged-in user id, optional
  const result = await PromotionService.getDetailsOfMerchant(req.params.id, userId);

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

const getPromotionsByUserCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryName } = req.query;
  const userId = (req.user as any)?._id; // logged-in user

  const promotions = await PromotionService.getPromotionsByUserCategory(
    String(categoryName),
    userId
  );

  res.status(200).json({
    success: true,
    message: "Promotions fetched successfully",
    data: promotions,
  });
});


const sendNotificationToCustomer = catchAsync(async (req: Request, res: Response) => {
  let attachment;
  if (req.files && "image" in req.files && req.files.image[0]) {
    attachment = `/images/${req.files.image[0].filename}`;
  }

  const data = {
    ...req.body,
    attachment,
  };
  const merchant = req.user as JwtPayload;
  const result = await PromotionService.sendNotificationToCustomer(data, merchant._id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotion Notification sent successfully",
    data: result,
  });
});

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
  sendNotificationToCustomer

};
