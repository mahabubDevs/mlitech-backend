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
import QueryBuilder from "../../../../util/queryBuilder";
import { Rating } from "../../customer/rating/rating.model";

// 🔹 Demo data fallback


const checkout = catchAsync(async (req: Request, res: Response) => {
  const { digitalCardCode, totalBill, promotionId, pointRedeemed } = req.body;
  console.log("Checkout request body:", req.body);

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
    promotionId,
    pointRedeemed
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Checkout completed successfully",
    data: result,
  });
});


const requestApproval = catchAsync(async (req: Request, res: Response) => {
  const {
    digitalCardCode,
    promotionId,
    totalBill = 0,
    pointRedeemed = 0,
  } = req.body;
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
    data: requests,
  });
});

const approvePromotion = catchAsync(async (req: Request, res: Response) => {
  const { digitalCardCode, promotionId } = req.body;
  const user = req.user as IUser;

  if (!user._id) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "User ID not found",
    });
  }

  const result = await SellService.approvePromotion(
    digitalCardCode,
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

const approvePromotionreject = catchAsync(
  async (req: Request, res: Response) => {
    const { digitalCardCode, promotionId } = req.body;
    const user = req.user as IUser;

    if (!user._id) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "User ID not found",
      });
    }

    const result = await SellService.approvePromotionReject(
      digitalCardCode,
      promotionId,
      user._id.toString()
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Promotion approved successfully",
      data: result,
    });
  }
);

// Controller
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


const getUserFullTransactions = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const type = (req.query.type as "all" | "earn" | "use") || "all";
  const page = parseInt((req.query.page as string) || "1");
  const limit = parseInt((req.query.limit as string) || "20");

  const result = await SellService.getUserFullTransactions(userId, type, page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User transactions fetched successfully",
    data: result.transactions,
    // pagination: result.pagination,
  });
});



const getMerchantSales = async (req: Request, res: Response) => {
  try {
    // 🔐 Get merchant from login
    const merchant = req.user as { _id: string; role?: string };

    if (!merchant?._id || !Types.ObjectId.isValid(merchant._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    const merchantId = merchant._id;
    console.log("Merchant ID (from login):", merchantId);

    // 1️⃣ Base query for this merchant
    let query = Sell.find({ merchantId });

    // 2️⃣ Apply search, filter, sort, pagination using QueryBuilder
    const qb = new QueryBuilder(query, req.query)
      .filter() // filters from query params
      .search(["userId.firstName", "userId.lastName"]) // search term
      .sort()
      .paginate()
      .populate(["userId", "digitalCardId"], {
        userId: "firstName lastName email phone profile customUserId",
        digitalCardId: "cardCode",
      });

    // Execute query
    const sales = await qb.modelQuery.lean();
    const paginationInfo = await qb.getPaginationInfo();

    if (!sales || sales.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: paginationInfo,
        message: "No sales yet",
      });
    }

    // 3️⃣ Aggregate user data
    interface IUserSummary {
      _id: string;
      name: string;
      email?: string;
      phone?: string;
      profile?: string;
      totalTransactions: number;
      totalPointsEarned: number;
      totalPointsRedeemed: number;
      totalBilled?: number;
      finalBilled?: number;
      cardIds?: string; // single card code as string
      status?: string;
      customUserId?: string;
    }

    const userMap: Record<string, IUserSummary> = {};

    sales.forEach((tx: any) => {
      const user = tx.userId;
      if (!user || !user._id) return;
      const userId = user._id.toString();

      if (!userMap[userId]) {
        userMap[userId] = {
          _id: userId,
          name: user.firstName + (user.lastName ? ` ${user.lastName}` : ""),
          email: user.email,
          customUserId: user.customUserId || "",
          phone: user.phone,
          profile: user.profile,
          totalTransactions: 0,
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
          totalBilled: 0,
          finalBilled: 0,
          cardIds: "",
        };
      }

      userMap[userId].totalTransactions += 1;
      userMap[userId].totalPointsEarned += tx.pointsEarned || 0;
      userMap[userId].totalPointsRedeemed += tx.pointRedeemed || 0;
      userMap[userId].totalBilled! += tx.totalBill || 0;
      userMap[userId].finalBilled! += tx.discountedBill || 0;
      userMap[userId].status = tx.status || "";

      if (tx.digitalCardId && tx.digitalCardId.cardCode) {
        userMap[userId].cardIds = tx.digitalCardId.cardCode;
      }
    });

    const result = Object.values(userMap);

    return res.status(200).json({
      success: true,
      data: result,
      pagination: paginationInfo,
    });
  } catch (error) {
    console.error("Error in getMerchantSales:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error,
    });
  }
};




const getMerchantCustomersList = async (
  req: Request,
  res: Response
) => {
  try {
    // 🔐 merchant from logged-in user
    const merchant = req.user as { _id: string; role?: string };

    if (!merchant?._id || !Types.ObjectId.isValid(merchant._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    const merchantId = merchant._id;

    // 1️⃣ Base query (this merchant only)
    let query = Sell.find({ merchantId });

    // 2️⃣ Apply query builder
    const qb = new QueryBuilder(query, req.query)
      .filter()
      .search(["userId.firstName", "userId.lastName"])
      .sort()
      .paginate()
      .populate(["userId", "digitalCardId", "merchantId"], {
        userId: "firstName lastName email phone profile customUserId country",
        digitalCardId: "cardCode availablePoints tier createdAt",
        merchantId: "businessName shopName firstName",
      });

    // 3️⃣ Execute query
    const sales = await qb.modelQuery.lean();
    const paginationInfo = await qb.getPaginationInfo();

    if (!sales.length) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: paginationInfo,
      });
    }

    // 4️⃣ Collect unique customer userIds
    const userIds = [
      ...new Set(
        sales
          .map((tx: any) => tx.userId?._id?.toString())
          .filter(Boolean)
      ),
    ];

    // 5️⃣ Fetch ratings (given to this merchant)
    const ratings = await Rating.find({
      merchantId,
      userId: { $in: userIds },
    })
      .select("userId rating comment")
      .lean();

    // 6️⃣ Build rating map
    const ratingMap: Record<string, { rating: number; comment: string }> = {};

    ratings.forEach((r: any) => {
      ratingMap[r.userId.toString()] = {
        rating: r.rating,
        comment: r.comment,
      };
    });

    // 7️⃣ Customer summary interface
    interface IUserSummary {
      _id: string;
      name: string;
      email?: string;
      phone?: string;
      profile?: string;
      country?: string;
      customUserId?: string;
      totalTransactions: number;
      totalPointsEarned: number;
      totalPointsRedeemed: number;
      totalBilled: number;
      finalBilled: number;
      cardIds?: string;
      availablePoints?: number;
      status?: string;
      salesRep?: string;
      rating?: number;
      ratingComment?: string;
      tier?: string;
      createdAt?: Date;
    }

    const userMap: Record<string, IUserSummary> = {};

    // 8️⃣ Aggregate sales per customer
    sales.forEach((tx: any) => {
      const user = tx.userId;
      if (!user?._id) return;

      const userId = user._id.toString();

      if (!userMap[userId]) {
        userMap[userId] = {
          _id: userId,
          name: `${user.firstName} ${user.lastName || ""}`.trim(),
          email: user.email,
          phone: user.phone,
          profile: user.profile,
          country: user.country,
          customUserId: user.customUserId || "",
          totalTransactions: 0,
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
          totalBilled: 0,
          finalBilled: 0,
          cardIds: "",
          availablePoints: tx.digitalCardId?.availablePoints || 0,
          tier: tx.digitalCardId?.tier || "",
          createdAt: tx.digitalCardId?.createdAt || null,
          salesRep:
            tx.merchantId?.businessName ||
            tx.merchantId?.shopName ||
            tx.merchantId?.firstName ||
            "",
          rating: ratingMap[userId]?.rating,
          ratingComment: ratingMap[userId]?.comment,
        };
      }

      userMap[userId].totalTransactions += 1;
      userMap[userId].totalPointsEarned += tx.pointsEarned || 0;
      userMap[userId].totalPointsRedeemed += tx.pointRedeemed || 0;
      userMap[userId].totalBilled += tx.totalBill || 0;
      userMap[userId].finalBilled += tx.discountedBill || 0;
      userMap[userId].status = tx.status;

      if (tx.digitalCardId?.cardCode) {
        userMap[userId].cardIds = tx.digitalCardId.cardCode;
      }
    });

    // 9️⃣ Response
    return res.status(200).json({
      success: true,
      data: Object.values(userMap),
      pagination: paginationInfo,
    });
  } catch (error) {
    console.error("Error in getMerchantCustomersList:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



export default {
  checkout,
  requestApproval,
  getPendingRequests,
  approvePromotion,
  approvePromotionreject,
  getPointsHistory,
  getMerchantSales,
  getMerchantCustomersList,
  getUserFullTransactions
  // finalizeCheckout
};
