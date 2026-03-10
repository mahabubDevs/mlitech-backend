import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { PromotionService } from "./promotionMercent.service";
import catchAsync from "../../../../shared/catchAsync";
import ApiError from "../../../../errors/ApiErrors";
import sendResponse from "../../../../shared/sendResponse";
import { IPromotion } from "./promotionMercent.interface";
import { JwtPayload } from "jsonwebtoken";
import { Promotion } from "./promotionMercent.model";
import {PromotionAdmin} from "../../adminSellandTier/promotionMercent/promotionMercent.model";
import { sendNotification } from "../../../../helpers/notificationsHelper";
import { NotificationType } from "../../notification/notification.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import { Rating } from "../../customer/rating/rating.model";
import { MerchantCustomer } from "../merchantCustomer/merchantCustomer.model";

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
    grossValue,
  } = bodyData;

  if (!name || !customerSegment || !promotionType || !grossValue) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Required fields missing");
  }

  // IMAGE URL
  let imageUrl: string | undefined = undefined;
  if (req.files && (req.files as any).image && (req.files as any).image[0]) {
    const file = (req.files as any).image[0];
    imageUrl = `/images/${file.filename}`;
  }

  // 🔑 USER from auth middleware
  const user = req.user as any;

  // ✅ APPLY YOUR LOGIC HERE
  const merchantId = user.isSubMerchant
    ? user.merchantId
    : user._id;

  if (!merchantId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Merchant ID not found");
  }

  const payload: Partial<IPromotion> = {
    name,
    discountPercentage: Number(discountPercentage),
    promotionType,
    customerSegment,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    availableDays,
    image: imageUrl,
    merchantId, // ✅ ALWAYS merchant ID
    grossValue: Number(grossValue),
  };

  const result = await PromotionService.createPromotionToDB(payload);

  if (result) {
    await sendNotification({
      userIds: [merchantId], // ✅ notify real merchant
      title: "Congratulations! promotion published",
      body: `Your promotion "${name}" has been published successfully`,
      type: NotificationType.PROMOTION,
    });
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
    const filterId = user.isSubMerchant ? user.merchantId : user._id;
    const result = await PromotionService.getAllPromotionsOfAMerchant(
      filterId,
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

// const getPromotionsForUser = catchAsync(async (req: Request, res: Response) => {
//   const userId = (req.user as any)?._id;
//   if (!userId) {
//     throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID not found");
//   }

//   // 1️⃣ User segment
//   const userSegment = await PromotionService.getUserSegment(userId);

//   // 2️⃣ Today
//   const today = new Date();
//   const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
//   const todayDay = dayMap[today.getDay()];

//   // 3️⃣ Promotions
//   let promotions = await Promotion.find({
//     customerSegment: { $in: [userSegment, "all_customer"] },
//     status: "active",
//   })
//     .populate("merchantId", "website name")
//     .lean();

//   // 4️⃣ User digital cards
//   const digitalCards = await DigitalCard.find({ userId }).select("promotions");

//   const existingPromotionIds = digitalCards.flatMap(card =>
//     card.promotions
//       .map(p => p.promotionId?.toString())
//       .filter(Boolean) as string[]
//   );

//   // 5️⃣ Date + day + card filter
//   promotions = promotions.filter(promo => {
//     const startDate = new Date(promo.startDate);
//     const endDate = new Date(promo.endDate);

//     const isValidDate = today >= startDate && today <= endDate;
//     const days = promo.availableDays || [];
//     const isValidDay = days.includes("all") || days.includes(todayDay);
//     const isNotInUserCard = !existingPromotionIds.includes(promo._id.toString());

//     return isValidDate && isValidDay && isNotInUserCard;
//   });

//   // 🔥 6️⃣ Get average rating per promotion
//   const promotionIds = promotions.map(p => p._id);

//   const ratingsAgg = await Rating.aggregate([
//     {
//       $match: {
//         promotionId: { $in: promotionIds },
//       },
//     },
//     {
//       $group: {
//         _id: "$promotionId",
//         averageRating: { $avg: "$rating" },
//         totalRatings: { $sum: 1 },
//       },
//     },
//   ]);

//   // 🔹 Convert to map for fast lookup
//   const ratingMap = new Map(
//     ratingsAgg.map(r => [
//       r._id.toString(),
//       {
//         averageRating: Number(r.averageRating.toFixed(1)),
//         totalRatings: r.totalRatings,
//       },
//     ])
//   );

//   // 7️⃣ Attach rating to promotion
//   promotions = promotions.map(promo => {
//     const ratingData = ratingMap.get(promo._id.toString());

//     return {
//       ...promo,
//       averageRating: ratingData?.averageRating || 0,
//       totalRatings: ratingData?.totalRatings || 0,
//     };
//   });

//   // 8️⃣ Response
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Promotions retrieved successfully for user",
//     data: promotions,
//   });
// });



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
    ...(bodyData.grossValue && { grossValue: Number(bodyData.grossValue) }),
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


// const getCombinePromotionsForUser = catchAsync(async (req: Request, res: Response) => {
//   const userId = (req.user as any)?._id;
//   if (!userId) throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID not found");

//   // 1️⃣ Get user segment
//   const userSegment = await PromotionService.getUserSegment(userId);

//   // 2️⃣ Today and day mapping
//   const today = new Date();
//   const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
//   const todayDay = dayMap[today.getDay()];

//   // 3️⃣ Fetch Merchant Promotions
//   let merchantPromotions = await Promotion.find({
//     customerSegment: { $in: [userSegment, "all_customer"] },
//     status: "active",
//   }).lean();
//   merchantPromotions = merchantPromotions.map(p => ({ ...p, source: "merchant" }));

//   console.log("🔹 Merchant promotions fetched:", merchantPromotions.length);

//   // 4️⃣ Fetch Admin Promotions
//   let adminPromotions = await PromotionAdmin.find({
//     customerSegment: { $in: [userSegment, "all_customer"] },
//     status: "active",
//   }).lean();
//   adminPromotions = adminPromotions.map(p => ({ ...p, source: "admin" }));

//   console.log("🔹 Admin promotions fetched:", adminPromotions.length);

//   // 5️⃣ Deduplicate admin promotions that exist in merchant promotions
//   const merchantIds = new Set(merchantPromotions.map(p => p._id.toString()));
//   adminPromotions = adminPromotions.filter(p => !merchantIds.has(p._id.toString()));

//   console.log("🔹 Admin promotions after dedup:", adminPromotions.length);

//   // 6️⃣ Combine both arrays
//   let promotions = [...merchantPromotions, ...adminPromotions];
//   console.log("🔹 Total combined promotions before filter:", promotions.length);

//   // 7️⃣ Filter by date, day, and already claimed cards
//   const digitalCards = await DigitalCard.find({ userId }).select("promotions");
//   const existingPromotionIds = digitalCards.flatMap(card =>
//     card.promotions.map(p => p.promotionId?.toString()).filter(Boolean)
//   );

//   promotions = promotions.filter(promo => {
//     const startDate = new Date(promo.startDate);
//     const endDate = new Date(promo.endDate);
//     const isValidDate = today >= startDate && today <= endDate;
//     const days = promo.availableDays || [];
//     const isValidDay = days.includes("all") || days.includes(todayDay);
//     const isNotInUserCard = !existingPromotionIds.includes(promo._id.toString());
//     return isValidDate && isValidDay && isNotInUserCard;
//   });

//   console.log("🔹 Promotions after date/day/userCard filter:", promotions.length);

//   // 8️⃣ Attach rating info
//   const promotionIds = promotions.map(p => p._id);
//   const ratingsAgg = await Rating.aggregate([
//     { $match: { promotionId: { $in: promotionIds } } },
//     { $group: { _id: "$promotionId", averageRating: { $avg: "$rating" }, totalRatings: { $sum: 1 } } },
//   ]);
//   const ratingMap = new Map(
//     ratingsAgg.map(r => [
//       r._id.toString(),
//       { averageRating: Number(r.averageRating.toFixed(1)), totalRatings: r.totalRatings },
//     ])
//   );

//   promotions = promotions.map(promo => {
//     const ratingData = ratingMap.get(promo._id.toString());
//     return {
//       ...promo,
//       averageRating: ratingData?.averageRating || 0,
//       totalRatings: ratingData?.totalRatings || 0,
//     };
//   });

//   // 9️⃣ Sort by createdAt descending
//   promotions.sort((a, b) =>
//     new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime()
//   );

//   console.log("🔹 Promotions after sorting:", promotions.map(p => ({ id: p._id, source: (p as any).source })));

//   // 10️⃣ Send response
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Promotions retrieved successfully for user",
//     data: promotions,
//   });
// });

const getCombinePromotionsForUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;
  if (!userId) throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID not found");

  const today = new Date();
  const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayDay = dayMap[today.getDay()];

  // 1️⃣ Fetch all active merchant promotions
  const allMerchantPromotions = await Promotion.find({ status: "active" }).lean();
  console.log(`\n🔹 Total merchant promotions in DB: ${allMerchantPromotions.length}`);
  allMerchantPromotions.forEach(p => {
    console.log(`Promotion "${p.name}" | Merchant: ${p.merchantId} | Promo Segment: ${p.customerSegment}`);
  });

  // 2️⃣ Bulk fetch MerchantCustomer segments
  const merchantIds = Array.from(new Set(allMerchantPromotions.map(p => p.merchantId)));
  const customerRecords = await MerchantCustomer.find({
    merchantId: { $in: merchantIds },
    customerId: userId,
  }).select("merchantId segment");

  const merchantSegmentMap = new Map(customerRecords.map(c => [c.merchantId.toString(), c.segment]));

  // 3️⃣ Merchant-wise segment filtering
  const merchantPromotions: any[] = [];
  for (const promo of allMerchantPromotions) {
    const userSegment = merchantSegmentMap.get(promo.merchantId.toString()) || "new_customer";

    console.log(
      `Checking promotion "${promo.name}" | Merchant: ${promo.merchantId} | ` +
      `Promo Segment: ${promo.customerSegment} | User Segment: ${userSegment}`
    );

    if (promo.customerSegment === "all_customer" || promo.customerSegment === userSegment) {
      merchantPromotions.push({ ...promo, source: "merchant", userSegment });
      console.log(`➡ Will be shown to user ✅`);
    } else {
      console.log(`➡ Will NOT be shown to user ❌`);
    }
  }

  console.log("🔹 Merchant promotions after segment filter:", merchantPromotions.length);

  // 4️⃣ Fetch all active admin promotions
  let adminPromotions = await PromotionAdmin.find({ status: "active" }).lean();
  adminPromotions = adminPromotions.map(p => ({ ...p, source: "admin" }));
  console.log("🔹 Admin promotions fetched:", adminPromotions.length);

  // 5️⃣ Deduplicate admin promotions
  const merchantPromoIds = new Set(merchantPromotions.map(p => p._id.toString()));
  adminPromotions = adminPromotions.filter(p => !merchantPromoIds.has(p._id.toString()));
  console.log("🔹 Admin promotions after dedup:", adminPromotions.length);

  // 6️⃣ Combine merchant + admin promotions
  let promotions = [...merchantPromotions, ...adminPromotions];
  console.log("🔹 Total combined promotions before date/day/userCard filter:", promotions.length);

  // 7️⃣ Filter by date/day/userCard
  const digitalCards = await DigitalCard.find({ userId }).select("promotions");
  const existingPromotionIds = new Set(
    digitalCards.flatMap(card =>
      card.promotions.map(p => (p.promotionId?._id || p.promotionId)?.toString())
    )
  );

  promotions = promotions.filter(promo => {
    const isAllCustomer = promo.customerSegment === "all_customer";

    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    const days = promo.availableDays || [];

    const isValidDate = today >= startDate && today <= endDate;
    const isValidDay = days.includes("all") || days.includes(todayDay);

    const isNotInUserCard = !existingPromotionIds.has(promo._id.toString());

    console.log(
      `Filtering promo "${promo.name}" | Segment: ${promo.customerSegment} | ` +
      `Start: ${promo.startDate} End: ${promo.endDate} | Days: ${days.join(",")} | ` +
      `isValidDate: ${isValidDate} | isValidDay: ${isValidDay} | NotInUserCard: ${isNotInUserCard}`
    );

    return isValidDate && isValidDay && isNotInUserCard;
  });

  console.log("🔹 Promotions after date/day/userCard filter:", promotions.length);

  // 8️⃣ Log final promotions
  promotions.forEach(p => {
    console.log(`✅ Final Promotion "${p.name}" | Merchant: ${p.merchantId} | Promo Segment: ${p.customerSegment} | User Segment: ${p.userSegment || 'N/A'}`);
  });

  // 9️⃣ Attach rating info
  const promotionIds = promotions.map(p => p._id);
  const ratingsAgg = await Rating.aggregate([
    { $match: { promotionId: { $in: promotionIds } } },
    {
      $group: {
        _id: "$promotionId",
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  const ratingMap = new Map(
    ratingsAgg.map(r => [
      r._id.toString(),
      { averageRating: Number(r.averageRating.toFixed(1)), totalRatings: r.totalRatings }
    ])
  );

  promotions = promotions.map(promo => {
    const ratingData = ratingMap.get(promo._id.toString());
    return {
      ...promo,
      averageRating: ratingData?.averageRating || 0,
      totalRatings: ratingData?.totalRatings || 0
    };
  });

  // 🔟 Sort by createdAt descending
  promotions.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  console.log("🔹 Total promotions sent to user:", promotions.length);

  // 1️⃣1️⃣ Send response
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotions retrieved successfully for user",
    data: promotions,
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

  // getPromotionsForUser,
  getCombinePromotionsForUser,

  getAllPromotionsOfAMerchant,
  sendNotificationToCustomer

};
