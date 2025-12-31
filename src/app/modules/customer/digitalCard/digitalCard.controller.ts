import { StatusCodes } from "http-status-codes";
import { DigitalCardService } from "./digitalCard.service";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";

import { IUser } from "../../user/user.interface";
import { Types } from "mongoose";
import { DigitalCard } from "./digitalCard.model";

// const addPromotion = catchAsync(async (req, res) => {
//   if (!req.user) {
//     return sendResponse(res, {
//       statusCode: StatusCodes.UNAUTHORIZED,
//       success: false,
//       message: "User not authenticated",
//     });
//   }
//   const user = req.user as IUser;
//   const userId = (user._id as Types.ObjectId).toString();
//   const { promotionId } = req.body;

//   const result = await DigitalCardService.addPromotionToDigitalCard(
//     userId,
//     promotionId
//   );

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Promotion added to digital card successfully",
//     data: result,
//   });
// });


const addPromotion = catchAsync(async (req, res) => {
  if (!req.user) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "User not authenticated",
    });
  }

  const user = req.user as IUser;
  const userId = (user._id as Types.ObjectId).toString();
  const { promotionId } = req.body;

  const result = await DigitalCardService.addPromotionToDigitalCard(
    userId,
    promotionId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotion added to digital card successfully",
    data: result,
  });
});



const getUserAddedPromotions = catchAsync(async (req, res) => {
  if (!req.user) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "User not authenticated",
    });
  }
  const user = req.user as IUser;
  const userId = (user._id as Types.ObjectId).toString();
  const result = await DigitalCardService.getUserAddedPromotions(
    userId,
    req.query
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User promotions retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

const getUserDigitalCards = catchAsync(async (req, res) => {
  if (!req.user) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "User not authenticated",
    });
  }

  const user = req.user as IUser;

  // Safely extract _id
  const userId = (user._id as Types.ObjectId).toString();

  const result = await DigitalCardService.getUserDigitalCards(
    userId,
    req.query
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User digital cards retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

const getDigitalCardPromotions = catchAsync(async (req, res) => {
  const { digitalCardId } = req.params;

  const result = await DigitalCardService.getPromotionsOfDigitalCard(
    digitalCardId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Digital card promotions retrieved successfully",
    data: result,
  });
});

const getMerchantDigitalCard = catchAsync(async (req, res) => {
  const { cardCode } = req.query;

  // 🔐 Auth check
  if (!req.user) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "User not authenticated",
    });
  }

  const user = req.user as IUser;

  // 🛑 Role check (FIXED)
  if (user.role !== "MERCENT") {
    return sendResponse(res, {
      statusCode: StatusCodes.FORBIDDEN,
      success: false,
      message: "Only merchant can access this",
    });
  }

  // 🆔 Merchant ID check
  const merchantId = user._id?.toString();
  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
    });
  }

  // 🧪 cardCode validation
  if (!cardCode || typeof cardCode !== "string") {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Card code or promotion code is required",
    });
  }

  // 🔍 Search digital card (cardCode OR promotionCode)
  const digitalCard =
    await DigitalCardService.getMerchantDigitalCardWithPromotions(
      merchantId,
      cardCode
    );

  if (!digitalCard) {
    return sendResponse(res, {
      statusCode: StatusCodes.NOT_FOUND,
      success: false,
      message: "No Digital Card for this customer found",
    });
  }

  // ✅ Success response
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Digital Card with promotions retrieved successfully",
    data: digitalCard,
  });
});


// // Type-safe request body
// interface ApprovePromotionBody {
//   digitalCardId: string;
//   promotionId: string;
//   approve: boolean;
// }

// const approvePromotion = catchAsync(
//   async (req, res) => {
//     const { digitalCardId, promotionId, approve } = req.body;

//     // Type cast req.user as IUser
//     const user = req.user as IUser;

//     if (!user || !user._id) {
//       return sendResponse(res, {
//         statusCode: StatusCodes.UNAUTHORIZED,
//         success: false,
//         message: "User not authenticated",
//       });
//     }

//     const digitalCard = await DigitalCard.findOne({
//       _id: digitalCardId,
//       userId: user._id,
//     });

//     if (!digitalCard) throw new Error("Digital Card not found");

//     // Find the promotion in the array
//     const promo = digitalCard.promotions.find(
//       (p) => p.promotionId?.toString() === promotionId
//     );

//     if (!promo) throw new Error("Promotion not found");

//     // Update approval
//     promo.approvedByUser = approve;
//     await digitalCard.save();

//     return sendResponse(res, {
//       statusCode: StatusCodes.OK,
//       success: true,
//       message: approve ? "Promotion approved" : "Promotion declined",
//       data: { digitalCardId, promotionId, approved: approve },
//     });
//   }
// );

export const DigitalCardController = {
  addPromotion,
  getUserAddedPromotions,
  getUserDigitalCards,
  getDigitalCardPromotions,
  getMerchantDigitalCard,
  //   approvePromotion
};
