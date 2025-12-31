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
import moment from "moment";
import ExcelJ from "exceljs";

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

  // ✅ Negative value check
  if (totalBill < 0 || pointRedeemed < 0) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "totalBill and pointRedeemed cannot be negative",
    });
  }

  // Updated: Pass both digitalCardCode and promotionId
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
    const merchant = req.user as { _id: string; role?: string };

    if (!merchant?._id || !Types.ObjectId.isValid(merchant._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    const merchantId = merchant._id;

    /* -----------------------------
       0️⃣ Date filter based on period (UTC)
    ------------------------------*/
    const period = req.query.period as string; // "day", "week", "month"
    const now = new Date();
    let dateFilter: any = {};

    if (period === "day") {
      const startOfDayUTC = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        )
      );
      dateFilter = { createdAt: { $gte: startOfDayUTC } };
    } 
    else if (period === "week") {
      const startOfWeekUTC = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - now.getUTCDay()
        )
      );
      dateFilter = { createdAt: { $gte: startOfWeekUTC } };
    } 
    else if (period === "month") {
      const startOfMonthUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      );
      dateFilter = { createdAt: { $gte: startOfMonthUTC } };
    }

    console.log("📌 Merchant Sales Period:", period);
    console.log("📌 Merchant Sales Date Filter (UTC):", dateFilter);

    /* -----------------------------
       1️⃣ Base query for this merchant
    ------------------------------*/
    let query = Sell.find({ merchantId, ...dateFilter })
      .populate("userId", "firstName lastName email phone profile customUserId")
      .populate("digitalCardId", "cardCode")
      .lean();

    const sales = await query;

    if (!sales || sales.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPage: 0,
        },
        message: "No sales found for this period",
      });
    }

    /* -----------------------------
       2️⃣ Aggregate user data
    ------------------------------*/
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
      cardIds?: string;
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
          name: `${user.firstName} ${user.lastName || ""}`.trim(),
          email: user.email,
          phone: user.phone,
          profile: user.profile,
          customUserId: user.customUserId || "",
          totalTransactions: 0,
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
          totalBilled: 0,
          finalBilled: 0,
          cardIds: "",
          status: "",
        };
      }

      userMap[userId].totalTransactions += 1;
      userMap[userId].totalPointsEarned += tx.pointsEarned || 0;
      userMap[userId].totalPointsRedeemed += tx.pointRedeemed || 0;
      userMap[userId].totalBilled! += tx.totalBill || 0;
      userMap[userId].finalBilled! += tx.discountedBill || 0;
      userMap[userId].status = tx.status || "";

      if (tx.digitalCardId?.cardCode) {
        userMap[userId].cardIds = tx.digitalCardId.cardCode;
      }
    });

    /* -----------------------------
       3️⃣ Manual Pagination
    ------------------------------*/
    const customers = Object.values(userMap);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const paginatedCustomers = customers.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: customers.length,
        totalPage: Math.ceil(customers.length / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error in getMerchantSales:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};




const getMerchantCustomersList = async (req: Request, res: Response) => {
  try {
    const merchant = req.user as { _id: string };

    if (!merchant?._id || !Types.ObjectId.isValid(merchant._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    const merchantId = merchant._id;

    /* -----------------------------
       0️⃣ Date filter based on period (UTC)
    ------------------------------*/
    const period = req.query.period as string; // "day", "week", "month"
    const now = new Date();
    let dateFilter: any = {};

    if (period === "day") {
      const startOfDayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      dateFilter = { createdAt: { $gte: startOfDayUTC } };
    } else if (period === "week") {
      const startOfWeekUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
      dateFilter = { createdAt: { $gte: startOfWeekUTC } };
    } else if (period === "month") {
      const startOfMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      dateFilter = { createdAt: { $gte: startOfMonthUTC } };
    }

    console.log("📌 Period filter:", period);
    console.log("📌 Date filter applied (UTC):", dateFilter);

    /* -----------------------------
       1️⃣ Fetch all completed sells
    ------------------------------*/
    let query = Sell.find({ merchantId, status: "completed", ...dateFilter })
      .populate("userId", "firstName lastName email phone profile customUserId country")
      .populate("digitalCardId", "cardCode availablePoints tier createdAt")
      .populate("merchantId", "businessName shopName firstName")
      .lean();



    const sales = await query;


    if (!sales.length) {
      console.log("ℹ No sales found for this merchant and period");
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPage: 0,
        },
      });
    }

    /* -----------------------------
       2️⃣ Ratings
    ------------------------------*/
    const userIds = [...new Set(sales.map((tx: any) => tx.userId?._id?.toString()).filter(Boolean))];
    console.log("📌 Unique user IDs from sales:", userIds);

    const ratings = await Rating.find({
      merchantId,
      userId: { $in: userIds },
    })
      .select("userId rating comment")
      .lean();

    const ratingMap: Record<string, any> = {};
    ratings.forEach((r: any) => {
      ratingMap[r.userId.toString()] = r;
    });


    /* -----------------------------
       3️⃣ Aggregate customer data
    ------------------------------*/
    const userMap: Record<string, any> = {};

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
          availablePoints: tx.digitalCardId?.availablePoints || 0,
          tier: tx.digitalCardId?.tier || "",
          createdAt: tx.digitalCardId?.createdAt || null,
          digitalCardId: tx.digitalCardId?._id || null,
          salesRep:
            tx.merchantId?.businessName ||
            tx.merchantId?.shopName ||
            tx.merchantId?.firstName ||
            "",
          rating: ratingMap[userId]?.rating,
          ratingComment: ratingMap[userId]?.comment,
          status: "completed",
        };
      }

      userMap[userId].totalTransactions += 1;
      userMap[userId].totalPointsEarned += tx.pointsEarned || 0;
      userMap[userId].totalPointsRedeemed += tx.pointRedeemed || 0;
      userMap[userId].totalBilled += tx.totalBill || 0;
      userMap[userId].finalBilled += tx.discountedBill || 0;
    });

 

    /* -----------------------------
       4️⃣ Manual Pagination (CUSTOMER level)
    ------------------------------*/
    const customers = Object.values(userMap);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const paginatedCustomers = customers.slice(skip, skip + limit);

    /* -----------------------------
       5️⃣ Response
    ------------------------------*/

    return res.status(200).json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: customers.length,
        totalPage: Math.ceil(customers.length / limit),
      },
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



const exportMerchantCustomersExcel = catchAsync(
  async (req: Request, res: Response) => {
    const merchant = req.user as { _id: string };

    if (!merchant?._id || !Types.ObjectId.isValid(merchant._id)) {
      return res.status(401).json({ success: false, message: "Unauthorized merchant" });
    }

    const merchantId = merchant._id;

    const period = req.query.period as string;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dateFilter: any = {};
    if (period === "day") {
      dateFilter = { createdAt: { $gte: today } };
    } else if (period === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (period === "month") {
      const startOfMonth = new Date(today);
      startOfMonth.setDate(1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }

    const query = Sell.find({ merchantId, status: "completed", ...dateFilter });

    const qb = new QueryBuilder(query, req.query)
      .filter()
      .search(["userId.firstName", "userId.lastName"])
      .sort()
      .populate(["userId", "digitalCardId", "merchantId"], {
        userId: "firstName lastName email phone profile customUserId country",
        digitalCardId: "cardCode availablePoints tier createdAt",
        merchantId: "businessName shopName firstName",
      });

    const sales = await qb.modelQuery.lean();

    const userIds = [
      ...new Set(
        sales.map((tx: any) => tx.userId?._id?.toString()).filter(Boolean)
      ),
    ];

    const ratings = await Rating.find({ merchantId, userId: { $in: userIds } })
      .select("userId rating comment")
      .lean();

    const ratingMap: Record<string, any> = {};
    ratings.forEach((r: any) => {
      ratingMap[r.userId.toString()] = r;
    });

    const userMap: Record<string, any> = {};
    sales.forEach((tx: any) => {
      const user = tx.userId;
      if (!user?._id) return;

      const userId = user._id.toString();

      if (!userMap[userId]) {
        userMap[userId] = {
          UserID: userId,
          Name: `${user.firstName} ${user.lastName || ""}`.trim(),
          Email: user.email,
          Phone: user.phone,
          Country: user.country,
          CustomID: user.customUserId || "",
          TotalTransactions: 0,
          TotalPointsEarned: 0,
          TotalPointsRedeemed: 0,
          TotalBilled: 0,
          FinalBilled: 0,
          AvailablePoints: tx.digitalCardId?.availablePoints || 0,
          Tier: tx.digitalCardId?.tier || "",
          CreatedAt: tx.digitalCardId?.createdAt || null,
          SalesRep:
            tx.merchantId?.businessName ||
            tx.merchantId?.shopName ||
            tx.merchantId?.firstName ||
            "",
          Rating: ratingMap[userId]?.rating || null,
          RatingComment: ratingMap[userId]?.comment || null,
        };
      }

      userMap[userId].TotalTransactions += 1;
      userMap[userId].TotalPointsEarned += tx.pointsEarned || 0;
      userMap[userId].TotalPointsRedeemed += tx.pointRedeemed || 0;
      userMap[userId].TotalBilled += tx.totalBill || 0;
      userMap[userId].FinalBilled += tx.discountedBill || 0;
    });

    const customers = Object.values(userMap);

    // ===== Excel Workbook =====
    const workbook = new ExcelJ.Workbook();
    workbook.creator = "Your Company Name";
    workbook.created = new Date();

    // ===== Single Sheet: Customers + Summary =====
    const sheet = workbook.addWorksheet("Customers");

    sheet.columns = [
      { header: "User ID", key: "UserID", width: 28 },
      { header: "Name", key: "Name", width: 25 },
      { header: "Email", key: "Email", width: 30 },
      { header: "Phone", key: "Phone", width: 18 },
      { header: "Country", key: "Country", width: 18 },
      { header: "Custom ID", key: "CustomID", width: 20 },
      { header: "Total Transactions", key: "TotalTransactions", width: 18 },
      { header: "Points Earned", key: "TotalPointsEarned", width: 18 },
      { header: "Points Redeemed", key: "TotalPointsRedeemed", width: 18 },
      { header: "Total Billed", key: "TotalBilled", width: 18 },
      { header: "Final Billed", key: "FinalBilled", width: 18 },
      { header: "Available Points", key: "AvailablePoints", width: 18 },
      { header: "Tier", key: "Tier", width: 15 },
      { header: "Created At", key: "CreatedAt", width: 20 },
      { header: "Sales Rep", key: "SalesRep", width: 25 },
      { header: "Rating", key: "Rating", width: 10 },
      { header: "Rating Comment", key: "RatingComment", width: 30 },
    ];

    customers.forEach((c) => {
      sheet.addRow({
        ...c,
        CreatedAt: c.CreatedAt ? new Date(c.CreatedAt).toLocaleString() : "",
      });
    });

    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = "A1:Q1";

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=merchant_customers.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  }
);

export default {
  checkout,
  requestApproval,
  getPendingRequests,
  approvePromotion,
  approvePromotionreject,
  getPointsHistory,
  getMerchantSales,
  getMerchantCustomersList,
  getUserFullTransactions,
  exportMerchantCustomersExcel
  // finalizeCheckout
};
