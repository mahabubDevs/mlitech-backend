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

  // Only allow merchant or sub-merchant
  if (user.role !== "MERCENT" && !user.isSubMerchant) {
    return sendResponse(res, {
      statusCode: StatusCodes.FORBIDDEN,
      success: false,
      message: "Only merchant or merchant staff can perform checkout",
    });
  }

  // -----------------------------
  // Resolve real merchant ID
  // -----------------------------
  const merchantId = user.isSubMerchant ? user.merchantId : user._id;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
    });
  }

  // -----------------------------
  // Call service
  // -----------------------------
  const result = await SellService.checkout(
    merchantId.toString(),  // always the real merchant
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

  const user = req.user as IUser;

  // ✅ Determine merchant ID based on user role
  const merchantId = user.isSubMerchant ? user.merchantId : user._id;

  if (!merchantId) {
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

  // ✅ Pass resolved merchantId to service
  const result = await SellService.requestApproval({
    merchantId: merchantId.toString(), // always the real merchant
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
    // -----------------------------
    // 0️⃣ Merchant / Sub-Merchant Check
    // -----------------------------
    const user = req.user as {
      _id: string;
      role?: string;
      isSubMerchant?: boolean;
      merchantId?: string;
    };

    if (!user?._id || !Types.ObjectId.isValid(user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    // Decide which ID to use for filtering
    const merchantId = user.isSubMerchant ? user.merchantId : user._id;
    console.log("🔹 Filter by merchant ID:", merchantId);

    // -----------------------------
    // 1️⃣ Date filter (UTC) based on period OR month
    // -----------------------------
    const period = req.query.period as string;
    const monthParam = req.query.month as string; // 1-12
    const now = new Date();
    let dateFilter: any = {};

    if (monthParam) {
      const month = Number(monthParam) - 1; // JS month 0-11
      const year = now.getFullYear();
      const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (period === "day") {
      const startOfDayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      dateFilter = { createdAt: { $gte: startOfDayUTC } };
    } else if (period === "week") {
      const startOfWeekUTC = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - now.getUTCDay()
        )
      );
      dateFilter = { createdAt: { $gte: startOfWeekUTC } };
    } else if (period === "month") {
      const startOfMonthUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      );
      dateFilter = { createdAt: { $gte: startOfMonthUTC } };
    }

       // -----------------------------
    // 2️⃣ Search keyword → searchTerm
    // -----------------------------
    const searchTerm = (req.query.searchTerm as string)?.toLowerCase() || "";

    // -----------------------------
    // 3️⃣ Fetch sales
    // -----------------------------
    const sales = await Sell.find({ merchantId, ...dateFilter })
      .populate(
        "userId",
        "firstName lastName email phone profile customUserId"
      )
      .populate("digitalCardId", "cardCode")
      .lean();

    if (!sales || sales.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { page: 1, limit: 0, total: 0, totalPage: 0 },
        message: "No sales found for this period",
      });
    }

    // -----------------------------
    // 4️⃣ Apply SEARCH (JS level)
    // -----------------------------
    let filteredSales = sales;
    if (searchTerm) {
      filteredSales = sales.filter((tx: any) => {
        const user = tx.userId || {};
        const card = tx.digitalCardId || {};
        return (
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm) ||
          user.phone?.toLowerCase().includes(searchTerm) ||
          card.cardCode?.toLowerCase().includes(searchTerm)
        );
      });
    }


    // -----------------------------
    // 5️⃣ Aggregate user data
    // -----------------------------
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
    filteredSales.forEach((tx: any) => {
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

    // -----------------------------
    // 6️⃣ Pagination
    // -----------------------------
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
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};






const getMerchantCustomersList = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    // ✅ Decide which ID to use for filtering
    const filterId = user.isSubMerchant ? user.merchantId : user._id;

    if (!filterId || !Types.ObjectId.isValid(filterId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    const merchantId = filterId;

    /* -----------------------------
       0️⃣ Date filter based on period (UTC)
    ------------------------------*/
    const period = req.query.period as string;
    const now = new Date();
    let dateFilter: any = {};

    if (period === "day") {
      const startOfDayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      dateFilter = { createdAt: { $gte: startOfDayUTC } };
    } else if (period === "week") {
      const startOfWeekUTC = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - now.getUTCDay()
        )
      );
      dateFilter = { createdAt: { $gte: startOfWeekUTC } };
    } else if (period === "month") {
      const startOfMonthUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      );
      dateFilter = { createdAt: { $gte: startOfMonthUTC } };
    }

    console.log("📌 Period filter:", period);
    console.log("📌 Date filter applied (UTC):", dateFilter);

    /* -----------------------------
       🔍 Search keyword
    ------------------------------*/
    const search = (req.query.search as string)?.toLowerCase() || "";

    /* -----------------------------
       1️⃣ Fetch all completed sells
    ------------------------------*/
    const sales = await Sell.find({
      merchantId,
      status: "completed",
      ...dateFilter,
    })
      .populate(
        "userId",
        "firstName lastName email phone profile customUserId country"
      )
      .populate("digitalCardId", "cardCode availablePoints tier createdAt")
      .populate("merchantId", "businessName shopName firstName")
      .lean();

    if (!sales.length) {
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
       🔍 Apply SEARCH (JS level)
    ------------------------------*/
/* -----------------------------
   🔍 Apply SEARCH (JS level)
   Only by customer ID, name, or country
------------------------------*/
// Remove any previous `const search` declaration
const searchTerm = ((req.query.search as string) || (req.query.searchTerm as string) || "")
  .toLowerCase()
  .trim();

let filteredSales = sales;

if (searchTerm) {
  console.log("🔍 Search keyword:", searchTerm);

  filteredSales = sales.filter((tx: any) => {
    const user = tx.userId || {};
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const customId = (user.customUserId || "").toLowerCase();
    const country = (user.country || "").toLowerCase();

    console.log("🧾 Checking user:", {
      fullName,
      customId,
      country,
    });

    return (
      fullName.includes(searchTerm) ||    // search by name
      customId.includes(searchTerm) ||    // search by customer ID
      country.includes(searchTerm)        // search by country/location
    );
  });
}



    /* -----------------------------
       2️⃣ Ratings
    ------------------------------*/
    const userIds = [
      ...new Set(
        filteredSales
          .map((tx: any) => tx.userId?._id?.toString())
          .filter(Boolean)
      ),
    ];

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

    filteredSales.forEach((tx: any) => {
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
       4️⃣ Manual Pagination
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
    console.error("❌ Error in getMerchantCustomersList:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const getRecentMerchantCustomersList = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    // ✅ Merchant / Sub-merchant filter
    const filterId = user.isSubMerchant ? user.merchantId : user._id;

    if (!filterId || !Types.ObjectId.isValid(filterId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    const merchantId = new Types.ObjectId(filterId);

    /* -----------------------------
       🔍 Search (name / customUserId / country)
    ------------------------------*/
    const searchTerm = ((req.query.searchTerm as string) || "")
      .toLowerCase()
      .trim();

    /* -----------------------------
       📊 Aggregation for NEW MEMBERS
    ------------------------------*/
    const pipeline: any[] = [
      {
        $match: {
          merchantId,
          status: "completed",
        },
      },
      {
        // group by customer
        $group: {
          _id: "$userId",
          firstPurchaseAt: { $min: "$createdAt" },
          totalTransactions: { $sum: 1 },
          totalPointsEarned: { $sum: "$pointsEarned" },
          totalPointsRedeemed: { $sum: "$pointRedeemed" },
          totalBilled: { $sum: "$totalBill" },
          finalBilled: { $sum: "$discountedBill" },
        },
      },
      {
        // newest member first
        $sort: { firstPurchaseAt: -1 },
      },
      {
        // user join
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        // optional search
        $match: searchTerm
          ? {
              $or: [
                {
                  "user.firstName": {
                    $regex: searchTerm,
                    $options: "i",
                  },
                },
                {
                  "user.lastName": {
                    $regex: searchTerm,
                    $options: "i",
                  },
                },
                {
                  "user.customUserId": {
                    $regex: searchTerm,
                    $options: "i",
                  },
                },
                {
                  "user.country": {
                    $regex: searchTerm,
                    $options: "i",
                  },
                },
              ],
            }
          : {},
      },
    ];

    const customers = await Sell.aggregate(pipeline);

    /* -----------------------------
       📄 Pagination
    ------------------------------*/
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const paginated = customers.slice(skip, skip + limit);

    /* -----------------------------
       ✅ Response
    ------------------------------*/
    return res.status(200).json({
      success: true,
      data: paginated.map((c: any) => ({
        _id: c._id,
        name: `${c.user.firstName} ${c.user.lastName || ""}`.trim(),
        email: c.user.email,
        phone: c.user.phone,
        country: c.user.country,
        customUserId: c.user.customUserId,
        firstPurchaseAt: c.firstPurchaseAt, // ⭐ new member indicator
        totalTransactions: c.totalTransactions,
        totalPointsEarned: c.totalPointsEarned,
        totalPointsRedeemed: c.totalPointsRedeemed,
        totalBilled: c.totalBilled,
        finalBilled: c.finalBilled,
      })),
      pagination: {
        page,
        limit,
        total: customers.length,
        totalPage: Math.ceil(customers.length / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error in getNewMerchantCustomersList:", error);
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
  getRecentMerchantCustomersList,
  getUserFullTransactions,
  exportMerchantCustomersExcel
  // finalizeCheckout
};
