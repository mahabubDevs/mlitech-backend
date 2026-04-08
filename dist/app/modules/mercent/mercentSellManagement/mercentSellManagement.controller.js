"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const mercentSellManagement_service_1 = require("./mercentSellManagement.service");
const digitalCard_model_1 = require("../../customer/digitalCard/digitalCard.model");
const mercentSellManagement_model_1 = require("./mercentSellManagement.model");
const mongoose_1 = require("mongoose");
const queryBuilder_1 = __importDefault(require("../../../../util/queryBuilder"));
const rating_model_1 = require("../../customer/rating/rating.model");
const exceljs_1 = __importDefault(require("exceljs"));
// 🔹 Demo data fallback
const checkout = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { digitalCardCode, totalBill, promotionId = [], pointRedeemed = 0 } = req.body;
    console.log("Checkout request body:", req.body);
    if (!req.user) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "User not authenticated",
        });
    }
    const user = req.user;
    if (user.role !== "MERCENT" && !user.isSubMerchant) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
            success: false,
            message: "Only merchant or merchant staff can perform checkout",
        });
    }
    const merchantId = user.isSubMerchant ? user.merchantId : user._id;
    if (!merchantId) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "Merchant ID not found",
        });
    }
    // ✅ always pass as array
    const promotionIdsArray = Array.isArray(promotionId)
        ? promotionId
        : promotionId
            ? [promotionId]
            : [];
    const result = yield mercentSellManagement_service_1.SellService.checkout(merchantId.toString(), digitalCardCode, totalBill, promotionIdsArray, // ✅ fixed
    pointRedeemed);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Checkout completed successfully",
        data: result,
    });
}));
const requestApproval = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { digitalCardCode, promotionId = [], totalBill = 0, pointRedeemed = 0, } = req.body;
    const user = req.user;
    // ✅ Determine merchant ID based on user role
    const merchantId = user.isSubMerchant ? user.merchantId : user._id;
    if (!merchantId) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "Merchant ID not found",
        });
    }
    // ✅ Negative value check
    if (totalBill < 0 || pointRedeemed < 0) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "totalBill and pointRedeemed cannot be negative",
        });
    }
    // ✅ Pass resolved merchantId to service
    const result = yield mercentSellManagement_service_1.SellService.requestApproval({
        merchantId: merchantId.toString(), // always the real merchant
        digitalCardCode,
        promotionId,
        totalBill,
        pointRedeemed,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Approval request simulated successfully",
        data: result,
    });
}));
// User → Get Pending Requests
const getPendingRequests = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user._id) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "User ID not found",
        });
    }
    const requests = yield mercentSellManagement_service_1.SellService.getPendingRequests(user._id.toString());
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Pending promotions fetched",
        data: requests,
    });
}));
const approvePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { digitalCardCode, promotionId, sellId } = req.body;
    const user = req.user;
    if (!user._id) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "User ID not found",
        });
    }
    // Ensure promotionId is an array
    const promotionIds = Array.isArray(promotionId) ? promotionId : [promotionId];
    const result = yield mercentSellManagement_service_1.SellService.approvePromotion(digitalCardCode, promotionIds, user._id.toString(), sellId // optional
    );
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion approved successfully",
        data: result,
    });
}));
const approvePromotionreject = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { digitalCardCode, promotionId, sellId } = req.body;
    const user = req.user;
    if (!user._id) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "User ID not found",
        });
    }
    const promotionIds = Array.isArray(promotionId) ? promotionId : [promotionId];
    const result = yield mercentSellManagement_service_1.SellService.approvePromotionReject(digitalCardCode, promotionIds, user._id.toString(), sellId // optional
    );
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion rejected successfully",
        data: result,
    });
}));
// Controller
const getPointsHistory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { digitalCardId, type } = req.query;
    if (!user._id) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "User ID not found",
        });
    }
    if (!digitalCardId) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "digitalCardId is required",
        });
    }
    const history = yield mercentSellManagement_service_1.SellService.getPointsHistory(digitalCardId.toString(), type || "all");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Points transactions fetched successfully",
        data: history,
    });
}));
const getUserFullTransactions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const type = req.query.type || "all";
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");
    const result = yield mercentSellManagement_service_1.SellService.getUserFullTransactions(userId, type, page, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User transactions fetched successfully",
        data: result.transactions,
        // pagination: result.pagination,
    });
}));
const getMerchantSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // -----------------------------
        // 0️⃣ Merchant / Sub-Merchant Check
        // -----------------------------
        const user = req.user;
        console.log("👤 User Info:", user);
        if (!(user === null || user === void 0 ? void 0 : user._id) || !mongoose_1.Types.ObjectId.isValid(user._id)) {
            console.log("❌ Unauthorized merchant access attempt");
            return res.status(401).json({
                success: false,
                message: "Unauthorized merchant",
            });
        }
        const merchantId = user.isSubMerchant ? user.merchantId : user._id;
        console.log("🛒 Merchant ID:", merchantId);
        // -----------------------------
        // 1️⃣ Date Filter (UTC)
        // -----------------------------
        const period = req.query.period;
        const monthParam = req.query.month;
        const now = new Date();
        let dateFilter = {};
        const currentYear = now.getUTCFullYear();
        // Monthly filter (Present Year Only)
        if (monthParam && Number(monthParam) >= 1 && Number(monthParam) <= 12) {
            const month = Number(monthParam) - 1;
            const startOfMonth = new Date(Date.UTC(currentYear, month, 1, 0, 0, 0));
            const endOfMonth = new Date(Date.UTC(currentYear, month + 1, 0, 23, 59, 59, 999));
            dateFilter.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
        }
        else if (period === "day") {
            const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            dateFilter.createdAt = { $gte: startOfDay };
        }
        else if (period === "week") {
            const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
            dateFilter.createdAt = { $gte: startOfWeek };
        }
        else if (period === "month") {
            const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            dateFilter.createdAt = { $gte: startOfMonth };
        }
        // -----------------------------
        // 1️⃣a Debug: Show Date Filter
        // -----------------------------
        console.log("🗓️ Date Filter Applied:", dateFilter);
        console.log("🛠️ Month Param:", monthParam);
        console.log("🛠️ Period Param:", period);
        // -----------------------------
        // 2️⃣ Search Term
        // -----------------------------
        const searchTerm = ((_a = req.query.searchTerm) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
        console.log("🔍 Search Term:", searchTerm);
        // -----------------------------
        // 3️⃣ Pagination
        // -----------------------------
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        console.log("📄 Pagination - Page:", page, "Limit:", limit, "Skip:", skip);
        // -----------------------------
        // 4️⃣ Fetch Sales
        // -----------------------------
        let sales = yield mercentSellManagement_model_1.Sell.find(Object.assign({ merchantId, status: "completed" }, dateFilter))
            .populate("userId", "firstName lastName email phone profile customUserId")
            .populate("digitalCardId", "cardCode")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        console.log("💰 Fetched Sales Count:", sales.length);
        // Log each sale basic info
        sales.forEach((tx, i) => {
            var _a, _b, _c;
            console.log(`🧾 Sale #${i + 1}:`, {
                _id: tx._id,
                user: tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : null,
                email: (_a = tx.userId) === null || _a === void 0 ? void 0 : _a.email,
                phone: (_b = tx.userId) === null || _b === void 0 ? void 0 : _b.phone,
                cardCode: (_c = tx.digitalCardId) === null || _c === void 0 ? void 0 : _c.cardCode,
                pointsEarned: tx.pointsEarned,
                pointsRedeemed: tx.pointRedeemed,
                totalBill: tx.totalBill,
                discountedBill: tx.discountedBill,
                status: tx.status,
                createdAt: tx.createdAt,
            });
        });
        if (!sales || sales.length === 0) {
            console.log("⚠️ No sales found for this period");
            return res.status(200).json({
                success: true,
                data: [],
                pagination: { page: 1, limit: 0, total: 0, totalPage: 0 },
                message: "No sales found for this period",
            });
        }
        // -----------------------------
        // 5️⃣ Apply SEARCH
        // -----------------------------
        if (searchTerm) {
            sales = sales.filter((tx) => {
                var _a, _b, _c, _d, _e;
                const u = tx.userId || {};
                const c = tx.digitalCardId || {};
                return (((_a = u.firstName) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm)) ||
                    ((_b = u.lastName) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm)) ||
                    ((_c = u.email) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(searchTerm)) ||
                    ((_d = u.phone) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(searchTerm)) ||
                    ((_e = c.cardCode) === null || _e === void 0 ? void 0 : _e.toLowerCase().includes(searchTerm)));
            });
            console.log("🔍 After Search Filter Count:", sales.length);
        }
        const total = yield mercentSellManagement_model_1.Sell.countDocuments(Object.assign({ merchantId, status: "completed" }, dateFilter));
        console.log("📊 Total Documents Matching Filter:", total);
        // -----------------------------
        // 6️⃣ Prepare Transaction Response
        // -----------------------------
        const transactionData = sales.map((tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return ({
                _id: (_a = tx.userId) === null || _a === void 0 ? void 0 : _a._id,
                name: `${((_b = tx.userId) === null || _b === void 0 ? void 0 : _b.firstName) || ""} ${((_c = tx.userId) === null || _c === void 0 ? void 0 : _c.lastName) || ""}`.trim(),
                email: (_d = tx.userId) === null || _d === void 0 ? void 0 : _d.email,
                phone: (_e = tx.userId) === null || _e === void 0 ? void 0 : _e.phone,
                profile: (_f = tx.userId) === null || _f === void 0 ? void 0 : _f.profile,
                customUserId: (_g = tx.userId) === null || _g === void 0 ? void 0 : _g.customUserId,
                totalTransactions: 1,
                totalPointsEarned: tx.pointsEarned || 0,
                totalPointsRedeemed: tx.pointRedeemed || 0,
                totalBilled: tx.totalBill || 0,
                finalBilled: tx.discountedBill || 0,
                cardIds: ((_h = tx.digitalCardId) === null || _h === void 0 ? void 0 : _h.cardCode) || "",
                status: tx.status || "",
                createdAt: tx.createdAt,
            });
        });
        console.log("✅ Prepared Transaction Data Count:", transactionData.length);
        // -----------------------------
        // 7️⃣ Response
        // -----------------------------
        return res.status(200).json({
            success: true,
            data: transactionData,
            pagination: {
                page,
                limit,
                total,
                totalPage: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("❌ Error in getMerchantSales:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});
const getMerchantCustomersList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        // ✅ Decide which ID to use for filtering
        const filterId = user.isSubMerchant ? user.merchantId : user._id;
        if (!filterId || !mongoose_1.Types.ObjectId.isValid(filterId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized merchant",
            });
        }
        const merchantId = filterId;
        /* -----------------------------
           0️⃣ Date filter based on period (UTC)
        ------------------------------*/
        const period = req.query.period;
        const now = new Date();
        let dateFilter = {};
        if (period === "day") {
            const startOfDayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            dateFilter = { createdAt: { $gte: startOfDayUTC } };
        }
        else if (period === "week") {
            const startOfWeekUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
            dateFilter = { createdAt: { $gte: startOfWeekUTC } };
        }
        else if (period === "month") {
            const startOfMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            dateFilter = { createdAt: { $gte: startOfMonthUTC } };
        }
        console.log("📌 Period filter:", period);
        console.log("📌 Date filter applied (UTC):", dateFilter);
        /* -----------------------------
           🔍 Search keyword
        ------------------------------*/
        const search = ((_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
        /* -----------------------------
           1️⃣ Fetch all completed sells
        ------------------------------*/
        const sales = yield mercentSellManagement_model_1.Sell.find(Object.assign({ merchantId, status: "completed" }, dateFilter))
            .populate("userId", "firstName lastName email phone profile customUserId country")
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
        const searchTerm = (req.query.search || req.query.searchTerm || "")
            .toLowerCase()
            .trim();
        let filteredSales = sales;
        if (searchTerm) {
            console.log("🔍 Search keyword:", searchTerm);
            filteredSales = sales.filter((tx) => {
                const user = tx.userId || {};
                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
                const customId = (user.customUserId || "").toLowerCase();
                const country = (user.country || "").toLowerCase();
                console.log("🧾 Checking user:", {
                    fullName,
                    customId,
                    country,
                });
                return (fullName.includes(searchTerm) || // search by name
                    customId.includes(searchTerm) || // search by customer ID
                    country.includes(searchTerm) // search by country/location
                );
            });
        }
        /* -----------------------------
           2️⃣ Ratings
        ------------------------------*/
        const userIds = [
            ...new Set(filteredSales
                .map((tx) => { var _a, _b; return (_b = (_a = tx.userId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(); })
                .filter(Boolean)),
        ];
        const ratings = yield rating_model_1.Rating.find({
            merchantId,
            userId: { $in: userIds },
        })
            .select("userId rating comment")
            .lean();
        const ratingMap = {};
        ratings.forEach((r) => {
            ratingMap[r.userId.toString()] = r;
        });
        /* -----------------------------
           3️⃣ Aggregate customer data
        ------------------------------*/
        const userMap = {};
        filteredSales.forEach((tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const user = tx.userId;
            if (!(user === null || user === void 0 ? void 0 : user._id))
                return;
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
                    availablePoints: ((_a = tx.digitalCardId) === null || _a === void 0 ? void 0 : _a.availablePoints) || 0,
                    tier: ((_b = tx.digitalCardId) === null || _b === void 0 ? void 0 : _b.tier) || "",
                    createdAt: ((_c = tx.digitalCardId) === null || _c === void 0 ? void 0 : _c.createdAt) || null,
                    digitalCardId: ((_d = tx.digitalCardId) === null || _d === void 0 ? void 0 : _d._id) || null,
                    salesRep: ((_e = tx.merchantId) === null || _e === void 0 ? void 0 : _e.businessName) ||
                        ((_f = tx.merchantId) === null || _f === void 0 ? void 0 : _f.shopName) ||
                        ((_g = tx.merchantId) === null || _g === void 0 ? void 0 : _g.firstName) ||
                        "",
                    rating: (_h = ratingMap[userId]) === null || _h === void 0 ? void 0 : _h.rating,
                    ratingComment: (_j = ratingMap[userId]) === null || _j === void 0 ? void 0 : _j.comment,
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
    }
    catch (error) {
        console.error("❌ Error in getMerchantCustomersList:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});
const getRecentMerchantCustomersList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        // ✅ Merchant / Sub-merchant filter
        const filterId = user.isSubMerchant ? user.merchantId : user._id;
        if (!filterId || !mongoose_1.Types.ObjectId.isValid(filterId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized merchant",
            });
        }
        const merchantId = new mongoose_1.Types.ObjectId(filterId);
        /* -----------------------------
           🔍 Search (name / customUserId / country)
        ------------------------------*/
        const searchTerm = (req.query.searchTerm || "")
            .toLowerCase()
            .trim();
        /* -----------------------------
           📊 Aggregation for NEW MEMBERS
        ------------------------------*/
        const pipeline = [
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
        const customers = yield mercentSellManagement_model_1.Sell.aggregate(pipeline);
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
            data: paginated.map((c) => ({
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
    }
    catch (error) {
        console.error("❌ Error in getNewMerchantCustomersList:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});
const exportMerchantCustomersExcel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = req.user;
    if (!(merchant === null || merchant === void 0 ? void 0 : merchant._id) || !mongoose_1.Types.ObjectId.isValid(merchant._id)) {
        return res.status(401).json({ success: false, message: "Unauthorized merchant" });
    }
    const merchantId = merchant._id;
    const period = req.query.period;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let dateFilter = {};
    if (period === "day") {
        dateFilter = { createdAt: { $gte: today } };
    }
    else if (period === "week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        dateFilter = { createdAt: { $gte: startOfWeek } };
    }
    else if (period === "month") {
        const startOfMonth = new Date(today);
        startOfMonth.setDate(1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
    }
    const query = mercentSellManagement_model_1.Sell.find(Object.assign({ merchantId, status: "completed" }, dateFilter));
    const qb = new queryBuilder_1.default(query, req.query)
        .filter()
        .search(["userId.firstName", "userId.lastName"])
        .sort()
        .populate(["userId", "digitalCardId", "merchantId"], {
        userId: "firstName lastName email phone profile customUserId country",
        digitalCardId: "cardCode availablePoints tier createdAt",
        merchantId: "businessName shopName firstName",
    });
    const sales = yield qb.modelQuery.lean();
    const userIds = [
        ...new Set(sales.map((tx) => { var _a, _b; return (_b = (_a = tx.userId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(); }).filter(Boolean)),
    ];
    const ratings = yield rating_model_1.Rating.find({ merchantId, userId: { $in: userIds } })
        .select("userId rating comment")
        .lean();
    const ratingMap = {};
    ratings.forEach((r) => {
        ratingMap[r.userId.toString()] = r;
    });
    const userMap = {};
    sales.forEach((tx) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const user = tx.userId;
        if (!(user === null || user === void 0 ? void 0 : user._id))
            return;
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
                AvailablePoints: ((_a = tx.digitalCardId) === null || _a === void 0 ? void 0 : _a.availablePoints) || 0,
                Tier: ((_b = tx.digitalCardId) === null || _b === void 0 ? void 0 : _b.tier) || "",
                CreatedAt: ((_c = tx.digitalCardId) === null || _c === void 0 ? void 0 : _c.createdAt) || null,
                SalesRep: ((_d = tx.merchantId) === null || _d === void 0 ? void 0 : _d.businessName) ||
                    ((_e = tx.merchantId) === null || _e === void 0 ? void 0 : _e.shopName) ||
                    ((_f = tx.merchantId) === null || _f === void 0 ? void 0 : _f.firstName) ||
                    "",
                Rating: ((_g = ratingMap[userId]) === null || _g === void 0 ? void 0 : _g.rating) || null,
                RatingComment: ((_h = ratingMap[userId]) === null || _h === void 0 ? void 0 : _h.comment) || null,
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
    const workbook = new exceljs_1.default.Workbook();
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
        sheet.addRow(Object.assign(Object.assign({}, c), { CreatedAt: c.CreatedAt ? new Date(c.CreatedAt).toLocaleString() : "" }));
    });
    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = "A1:Q1";
    const buffer = yield workbook.xlsx.writeBuffer();
    res.setHeader("Content-Disposition", "attachment; filename=merchant_customers.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
}));
const getLastPendingSell = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "User not authenticated",
            data: "Data nai",
        });
    }
    const user = req.user;
    const now = new Date();
    // আজকের তারিখের পূর্ব পর্যন্ত Pending Sell খুঁজবে
    const lastPendingSell = yield mercentSellManagement_model_1.Sell.findOne({
        userId: user._id,
        status: "pending",
        approvalExpiresAt: { $gte: now }, // এখনও এক্সপায়ার হয়নি এমন
    })
        .sort({ createdAt: -1 }) // সর্বশেষ ক্রিয়েটেড অনুযায়ী
        .populate("promotionIds"); // প্রমোশন ডিটেইল দেখার জন্য
    if (!lastPendingSell) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "No pending sell found",
            data: "Data nai",
        });
    }
    // 🔹 Fetch digital card for this sell
    const digitalCard = yield digitalCard_model_1.DigitalCard.findById(lastPendingSell.digitalCardId).lean();
    // ✅ Sell ID ও DigitalCard info attach করা
    const sellDataWithId = Object.assign(Object.assign({}, lastPendingSell.toObject()), { sellId: lastPendingSell._id, digitalCardId: digitalCard === null || digitalCard === void 0 ? void 0 : digitalCard._id, digitalCardCode: (digitalCard === null || digitalCard === void 0 ? void 0 : digitalCard.cardCode) || "" });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Last pending sell fetched successfully",
        data: sellDataWithId,
    });
}));
exports.default = {
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
    exportMerchantCustomersExcel,
    getLastPendingSell,
    // finalizeCheckout
};
