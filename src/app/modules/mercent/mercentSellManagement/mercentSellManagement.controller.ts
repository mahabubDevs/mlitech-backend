import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { SellService } from "./mercentSellManagement.service";
import { IUser } from "../../user/user.interface";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import { Sell } from "./mercentSellManagement.model";
import { Types } from "mongoose";
import { IDigitalCard, ISell } from "./mercentSellManagement.interface";


// 🔹 Demo data fallback
const demoSales = [
  {
    SL: 1,
    CustomerName: "Alice Johnson",
    CardID: "CARD001",
    TotalAmount: 120,
    PointRedeem: 20,
    PointEarned: 12,
    FinalAmount: 100,
    TransactionStatus: "Completed",
    Promotion: "Holiday Sale",
    Actions: ""
  },
  {
    SL: 2,
    CustomerName: "John Doe",
    CardID: "CARD002",
    TotalAmount: 80,
    PointRedeem: 10,
    PointEarned: 8,
    FinalAmount: 70,
    TransactionStatus: "Pending",
    Promotion: "New Year Offer",
    Actions: ""
  },
  {
    SL: 3,
    CustomerName: "Michael Brown",
    CardID: "CARD003",
    TotalAmount: 200,
    PointRedeem: 50,
    PointEarned: 20,
    FinalAmount: 150,
    TransactionStatus: "Completed",
    Promotion: null,
    Actions: ""
  }
];





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



// const getPointsHistory = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as IUser;
//   const { digitalCardId, type } = req.query;

//   if (!user._id) {
//     return sendResponse(res, {
//       statusCode: StatusCodes.BAD_REQUEST,
//       success: false,
//       message: "User ID not found",
//     });
//   }

//   if (!digitalCardId) {
//     return sendResponse(res, {
//       statusCode: StatusCodes.BAD_REQUEST,
//       success: false,
//       message: "digitalCardId is required",
//     });
//   }

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
    (type as "all" | "earn" | "use") || "all"
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Points transactions fetched successfully",
    data: history,
  });
});

// const getMerchantSales = async (req: Request, res: Response) => {
//   try {
//     const merchantId = req.params.merchantId;

//     if (!Types.ObjectId.isValid(merchantId)) {
//       return res.status(400).json({ success: false, message: "Invalid merchant ID" });
//     }

//     const sales = await Sell.find({ merchantId })
//       .populate("userId", "firstName lastName email")
//       .populate("digitalCardId", "cardNumber type")
//       .populate("promotionId", "name discountPercentage")
//       .sort({ createdAt: -1 })
//       .lean<Array<{
//         _id: string;
//         merchantId: string;
//         userId?: { firstName: string; lastName?: string; email?: string };
//         digitalCardId?: { cardNumber: string; type?: string };
//         promotionId?: { name: string; discountPercentage: number };
//         totalBill: number;
//         discountedBill: number;
//         pointsEarned: number;
//         pointRedeemed?: number;
//         status: "completed" | "pending";
//         createdAt: Date;
//         updatedAt: Date;
//       }>>();

//     const result = sales.map((tx, index: number) => ({
//       SL: index + 1,
//       CustomerName: tx.userId?.firstName + (tx.userId?.lastName ? " " + tx.userId?.lastName : ""),
//       CardID: tx.digitalCardId?.cardNumber || "",
//       TotalAmount: tx.totalBill,
//       PointRedeem: tx.pointRedeemed || 0,
//       PointEarned: tx.pointsEarned,
//       FinalAmount: tx.discountedBill,
//       TransactionStatus: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
//       Promotion: tx.promotionId?.name || null,
//       Actions: ""
//     }));

//     return res.status(200).json({ success: true, data: result });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: "Server Error", error });
//   }
// };



const getMerchantSales = async (req: Request, res: Response) => {
  try {
    const merchantId = req.params.merchantId;

    if (!Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ success: false, message: "Invalid merchant ID" });
    }

    // Fetch all sales for the merchant
    const sales = await Sell.find({ merchantId })
      .populate("userId", "firstName lastName email")
      .populate("digitalCardId", "cardNumber type")
      .populate("promotionId", "name discountPercentage")
      .sort({ createdAt: -1 })
      .lean<Array<{
        _id: string;
        merchantId: string;
        userId?: { firstName: string; lastName?: string; email?: string };
        digitalCardId?: { cardNumber: string; type?: string };
        promotionId?: { name: string; discountPercentage: number };
        totalBill: number;
        discountedBill: number;
        pointsEarned: number;
        pointRedeemed?: number;
        status: "completed" | "pending";
        createdAt: Date;
        updatedAt: Date;
      }>>();

    let result;

    if (sales.length > 0) {
      // Map real data to frontend format
      result = sales.map((tx, index: number) => ({
        SL: index + 1,
        CustomerName: tx.userId?.firstName + (tx.userId?.lastName ? " " + tx.userId?.lastName : ""),
        CardID: tx.digitalCardId?.cardNumber || "",
        TotalAmount: tx.totalBill,
        PointRedeem: tx.pointRedeemed || 0,
        PointEarned: tx.pointsEarned,
        FinalAmount: tx.discountedBill,
        TransactionStatus: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
        Promotion: tx.promotionId?.name || null,
        Actions: ""
      }));
    } else {
      // Return demo data if no real data
      result = demoSales;
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error", error });
  }
};


export default { 
  checkout ,
  requestApproval,
  getPendingRequests,
  approvePromotion,
  approvePromotionreject,
  getPointsHistory,
  getMerchantSales
  // finalizeCheckout
};
