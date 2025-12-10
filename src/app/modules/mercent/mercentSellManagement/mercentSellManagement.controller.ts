import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { SellService } from "./mercentSellManagement.service";
import { IUser } from "../../user/user.interface";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";


const checkout = catchAsync(async (req: Request, res: Response) => {
  const { digitalCardCode, totalBill, promotionId } = req.body;

  if (!req.user) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "User not authenticated",
    });
  }

  // -----------------------------
  // Safe casting to IUser
  // -----------------------------
  const user = req.user as IUser;

  // Only allow merchant
  if (user.role !== "MERCENT") {
    return sendResponse(res, {
      statusCode: StatusCodes.FORBIDDEN,
      success: false,
      message: "Only merchant can perform checkout",
    });
  }

  // Safely extract _id
  const merchantId = user._id?.toString();
  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
    });
  }

  // Call service
  const result = await SellService.checkout(
    merchantId,
    digitalCardCode,
    totalBill,
    promotionId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Checkout completed successfully",
    data: result,
  });
});


// const finalizeCheckout = catchAsync(async (req: Request, res: Response) => {
//   const { digitalCardId, promotionId, totalBill } = req.body;
//   const user = req.user as IUser; // merchant

//   const digitalCard = await DigitalCard.findOne({
//     _id: digitalCardId,
//     merchantId: user._id
//   });

//   if (!digitalCard) throw new Error("Digital Card not found");

//   const promo = digitalCard.promotions.find(p => p.promotionId && p.promotionId.toString() === promotionId);

//   if (!promo || !promo.approvedByUser)
//     throw new Error("Promotion not approved by user");

//   const discountPercentage = 20; // fetch from promotion model if needed
//   const discountedBill = totalBill - (totalBill * discountPercentage) / 100;

//   const pointsEarned = discountedBill;
//   digitalCard.availablePoints = (digitalCard.availablePoints || 0) + pointsEarned;
//   await digitalCard.save();

//   return sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Checkout confirmed. Discount applied & points added.",
//     data: { discountedBill, pointsEarned }
//   });
// });


// const requestApproval = catchAsync(async (req: Request, res: Response) => {
//   const { digitalCardCode, promotionId } = req.body;
//   const merchant = req.user as IUser;

//   if (!merchant._id) {
//     return sendResponse(res, {
//       statusCode: StatusCodes.BAD_REQUEST,
//       success: false,
//       message: "Merchant ID not found",
//     });
//   }

//   const result = await SellService.requestApproval(
//     merchant._id.toString(),
//     digitalCardCode,
//     promotionId
//   );

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Approval request sent to user",
//     data: result,
//   });
// });

const requestApproval = catchAsync(async (req: Request, res: Response) => {
  const { digitalCardCode, promotionId, totalBill = 0, pointRedeemed = 0 } = req.body;
  const merchant = req.user as IUser;

  if (!merchant._id) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
    });
  }

  const result = await SellService.requestApproval({
    merchantId: merchant._id.toString(),
    digitalCardCode,
    promotionId,
    totalBill,
    pointRedeemed,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Approval request simulated successfully",
    data: result,
  });
});




// User → Get Pending Requests
const getPendingRequests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;

  if (!user._id) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "User ID not found",
    });
  }

  const requests = await SellService.getPendingRequests(user._id.toString());

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pending promotions fetched",
    data: requests
  });
});


const approvePromotion = catchAsync(async (req: Request, res: Response) => {
  const { digitalCardId, promotionId } = req.body;
  const user = req.user as IUser;

  if (!user._id) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "User ID not found",
    });
  }

  const result = await SellService.approvePromotion(
    digitalCardId,
    promotionId,
    user._id.toString()
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotion approved successfully",
    data: result,
  });
});


const approvePromotionreject = catchAsync(async (req: Request, res: Response) => {
  const { digitalCardId, promotionId } = req.body;
  const user = req.user as IUser;

  if (!user._id) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "User ID not found",
    });
  }

  const result = await SellService.approvePromotionReject(
    digitalCardId,
    promotionId,
    user._id.toString()
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotion approved successfully",
    data: result,
  });
});



const getPointsHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  const { digitalCardId, type } = req.query;

  if (!user._id) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "User ID not found",
    });
  }

  if (!digitalCardId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "digitalCardId is required",
    });
  }

  const history = await SellService.getPointsHistory(
    digitalCardId.toString(),
    (type as "all" | "earn" | "redeem") || "all"
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Points transactions fetched successfully",
    data: history,
  });
});

export default { 
  checkout ,
  requestApproval,
  getPendingRequests,
  approvePromotion,
  approvePromotionreject,
  getPointsHistory
  // finalizeCheckout
};
