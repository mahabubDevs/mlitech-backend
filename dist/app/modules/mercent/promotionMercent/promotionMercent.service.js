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
exports.PromotionService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../../errors/ApiErrors"));
const queryBuilder_1 = __importDefault(require("../../../../util/queryBuilder"));
const digitalCard_model_1 = require("../../customer/digitalCard/digitalCard.model");
const rating_model_1 = require("../../customer/rating/rating.model");
const user_model_1 = require("../../user/user.model");
const tier_model_1 = require("../point&TierSystem/tier.model");
const promotionMercent_model_1 = require("./promotionMercent.model");
const mercentSellManagement_model_1 = require("../mercentSellManagement/mercentSellManagement.model");
const mongoose_1 = require("mongoose");
const notificationsHelper_1 = require("../../../../helpers/notificationsHelper");
const customerSegmentation_1 = require("../../../../util/customerSegmentation");
const notification_model_1 = require("../../notification/notification.model");
const generatePromotionCode = (length = 6) => {
    const chars = "0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CP-${code}`; // Prefix CP
};
const createPromotionToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.merchantId) {
        throw new Error("Merchant ID is required to create promotion.");
    }
    // ✅ Check if this merchant has at least one active tier
    const tierExists = yield tier_model_1.Tier.exists({
        admin: new mongoose_1.Types.ObjectId(payload.merchantId), // merchantId = admin in Tier
        isActive: true,
    });
    if (!tierExists) {
        throw new Error("Cannot create promotion: Merchant does not have any active tier. Please create at least one tier first.");
    }
    // Auto-generate cardId if not provided
    if (!payload.cardId) {
        payload.cardId = generatePromotionCode(6);
    }
    const promotion = new promotionMercent_model_1.Promotion(payload);
    return promotion.save();
});
const updatePromotionToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionMercent_model_1.Promotion.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
});
const getAllPromotionsFromDB = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const queryBuilder = new queryBuilder_1.default(promotionMercent_model_1.Promotion.find({}).populate("merchantId", "website"), query);
    queryBuilder.search(["name"]).filter().sort().paginate().fields();
    const promotions = yield queryBuilder.modelQuery;
    const pagination = yield queryBuilder.getPaginationInfo();
    return { pagination, promotions };
});
const getAllPromotionsOfAMerchant = (merchantId_1, ...args_1) => __awaiter(void 0, [merchantId_1, ...args_1], void 0, function* (merchantId, query = {}) {
    const queryBuilder = new queryBuilder_1.default(promotionMercent_model_1.Promotion.find({ merchantId }).populate("merchantId", "website"), query);
    queryBuilder.search(["name"]).filter().sort().paginate().fields();
    const promotions = yield queryBuilder.modelQuery;
    const pagination = yield queryBuilder.getPaginationInfo();
    return { pagination, promotions };
});
// Distance calculation function (Haversine)
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const getUserSegment = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const purchases = yield mercentSellManagement_model_1.Sell.find({ userId, status: "completed" }).sort({ createdAt: -1 }).lean();
    const totalPurchases = purchases.length;
    const last6MonthsPurchases = purchases.filter((p) => new Date(p.createdAt) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000));
    const totalSpend = purchases.reduce((sum, p) => sum + p.totalBill, 0);
    const avgSpend = 10000;
    let segment;
    if (totalPurchases === 0 || (totalPurchases === 1 && purchases[0].createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) {
        segment = "new_customer";
    }
    else if (totalPurchases >= 2 && last6MonthsPurchases.length < 5) {
        segment = "returning_customer";
    }
    else if (last6MonthsPurchases.length >= 20 || totalSpend >= 3 * avgSpend) {
        segment = "vip_customer";
    }
    else if (last6MonthsPurchases.length >= 5 || totalSpend >= 1.5 * avgSpend) {
        segment = "loyal_customer";
    }
    else {
        segment = "all_customer";
    }
    return segment; // ✅ শুধু string
});
// const getUserSegmentUpdate = async (userId: string, merchantId: string) => {
//   const customer = await MerchantCustomer.findOne({ userId, merchantId }).select("segment");
//   console.log("Customer segment from DB:", customer?.segment);
//   return customer?.segment || "new_customer"; // default
// };
const getSinglePromotionFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionMercent_model_1.Promotion.findById(id);
});
const deletePromotionFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionMercent_model_1.Promotion.findByIdAndDelete(id);
});
const togglePromotionInDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const promotion = yield promotionMercent_model_1.Promotion.findById(id);
    if (!promotion)
        return null;
    // Toggle status
    promotion.status = promotion.status === "active" ? "inactive" : "active";
    return promotion.save();
});
const getPopularMerchantsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rating_model_1.Rating.aggregate([
        {
            $group: {
                _id: "$merchantId",
                avgRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 },
            },
        },
        { $sort: { avgRating: -1, totalRatings: -1 } },
        { $limit: 20 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "merchant",
            },
        },
        { $unwind: "$merchant" },
        {
            $project: {
                _id: 1,
                avgRating: { $round: ["$avgRating", 2] },
                totalRatings: 1,
                // ✅ simple flat response
                firstName: "$merchant.firstName",
                email: "$merchant.email",
                profile: "$merchant.profile",
            },
        },
    ]);
    return result.length ? result : [];
});
const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const getDetailsOfMerchant = (merchantId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("========== API START: getDetailsOfMerchant ==========");
    console.log("merchantId:", merchantId);
    console.log("userId:", userId);
    // 1️⃣ Increment merchant visits
    yield user_model_1.User.updateOne({ _id: merchantId }, { $inc: { totalVisits: 1 } });
    console.log("✔ Merchant visit count incremented");
    // 2️⃣ Load merchant
    const merchant = yield user_model_1.User.findById(merchantId)
        .select("firstName businessName location profile photo about website address")
        .lean();
    if (!merchant)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    merchant.merchantName = merchant.businessName || merchant.firstName;
    merchant.availablePoints = 0;
    merchant.digitalCardId = ""; // default
    console.log(`✔ Merchant loaded: ${merchant.merchantName}`);
    let userSegment = "all_customer";
    let boughtPromotionIds = [];
    let userRatings = {};
    let userDigitalCard = null;
    /* ================= USER CONTEXT ================= */
    if (userId) {
        const activeUser = yield user_model_1.User.findById(userId).select("_id status").lean();
        console.log("User status:", activeUser === null || activeUser === void 0 ? void 0 : activeUser.status);
        if ((activeUser === null || activeUser === void 0 ? void 0 : activeUser.status) === "active") {
            userSegment = yield getUserSegment(userId);
            console.log("✔ User segment:", userSegment);
            // 🔹 Fetch user's digital card for this merchant
            const digitalCard = yield digitalCard_model_1.DigitalCard.findOne({ userId, merchantId }).lean();
            userDigitalCard = digitalCard;
            // ✅ Attach digitalCardId
            merchant.digitalCardId = (digitalCard === null || digitalCard === void 0 ? void 0 : digitalCard._id.toString()) || "";
            console.log("✔ User's digitalCardId:", merchant.digitalCardId);
            // 🔹 Bought promotion IDs
            boughtPromotionIds = (digitalCard === null || digitalCard === void 0 ? void 0 : digitalCard.promotions.map((p) => { var _a; return (_a = p.promotionId) === null || _a === void 0 ? void 0 : _a.toString(); }).filter((id) => !!id)) || [];
            console.log("✔ Bought promotion IDs from DigitalCard:", boughtPromotionIds);
            // 🔹 Fetch ratings for bought promotions
            const ratings = yield rating_model_1.Rating.find({
                merchantId,
                userId,
                promotionId: { $in: boughtPromotionIds },
            })
                .select("promotionId rating")
                .lean();
            ratings.forEach((r) => {
                if (r.promotionId)
                    userRatings[r.promotionId.toString()] = r.rating;
            });
            console.log("✔ User ratings map:", userRatings);
        }
    }
    /* ================= PROMOTIONS ================= */
    const allPromotions = yield promotionMercent_model_1.Promotion.find({ merchantId })
        .select("name discountPercentage startDate endDate image status availableDays customerSegment")
        .lean();
    const today = new Date();
    const todayDay = dayMap[today.getDay()];
    const promotions = allPromotions
        .map((promo) => {
        var _a, _b, _c, _d, _e;
        const promoId = promo._id.toString();
        const isBought = boughtPromotionIds.includes(promoId);
        const isValidDate = today >= new Date(promo.startDate) && today <= new Date(promo.endDate);
        const isValidDay = ((_a = promo.availableDays) === null || _a === void 0 ? void 0 : _a.includes("all")) || ((_b = promo.availableDays) === null || _b === void 0 ? void 0 : _b.includes(todayDay));
        const isActive = promo.status === "active";
        const segmentMatch = ((_c = promo.customerSegment) === null || _c === void 0 ? void 0 : _c.includes("all")) || ((_d = promo.customerSegment) === null || _d === void 0 ? void 0 : _d.includes(userSegment));
        const isValidPromo = isActive && isValidDate && isValidDay && (isBought || segmentMatch);
        if (!isValidPromo)
            return null;
        return Object.assign(Object.assign({}, promo), { buy: isBought, rating: isBought ? (_e = userRatings[promoId]) !== null && _e !== void 0 ? _e : 0 : 0 });
    })
        .filter(Boolean);
    console.log("✔ Total valid promotions found:", promotions.length);
    console.log("========== API END ==========");
    return { merchant, promotions, digitalCard: userDigitalCard };
});
const getUserTierOfMerchant = (userId, merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // 1. Get user's digital card
    const digitalCard = yield digitalCard_model_1.DigitalCard.findOne({
        userId,
        merchantId,
    }).select("lifeTimeEarnPoints");
    // Use lifetimeEarnPoints
    const availablePoints = (_a = digitalCard === null || digitalCard === void 0 ? void 0 : digitalCard.lifeTimeEarnPoints) !== null && _a !== void 0 ? _a : 0;
    // 2. Calculate total spent for this merchant
    const spendAgg = yield mercentSellManagement_model_1.Sell.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
                merchantId: new mongoose_1.Types.ObjectId(merchantId),
                status: "completed",
            },
        },
        {
            $group: {
                _id: null,
                totalSpend: { $sum: "$totalBill" },
            },
        },
    ]);
    const totalSpend = spendAgg.length ? spendAgg[0].totalSpend : 0;
    // 3. Get merchant tiers
    const tiers = yield tier_model_1.Tier.find({ admin: merchantId }).sort({
        pointsThreshold: 1,
        minTotalSpend: 1,
    });
    if (!tiers.length) {
        return {
            availablePoints, // lifetime points shown here
            totalSpend,
            tierName: "No tiers defined",
            rewardText: "N/A",
        };
    }
    // 4. Determine user's tier based on lifetime points and spend
    let userTier = null;
    for (const tier of tiers) {
        const meetsPoints = availablePoints >= tier.pointsThreshold;
        const meetsSpend = totalSpend >= tier.minTotalSpend;
        if (meetsPoints && meetsSpend) {
            userTier = tier; // keep highest eligible tier
        }
    }
    return {
        availablePoints, // lifetime points
        totalSpend,
        tierName: (_b = userTier === null || userTier === void 0 ? void 0 : userTier.name) !== null && _b !== void 0 ? _b : "No tier yet",
        rewardText: (_c = userTier === null || userTier === void 0 ? void 0 : userTier.reward) !== null && _c !== void 0 ? _c : "No reward",
    };
});
//catagory based promotion fetching
const getPromotionsByUserCategory = (categoryName, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!categoryName)
        throw new Error("Category name is required");
    console.log("Category Name:", categoryName);
    // 1️⃣ Find merchants by category
    const normalizedCategory = categoryName.replace(/&/g, 'and').trim();
    const merchants = yield user_model_1.User.find({ service: { $regex: new RegExp(normalizedCategory, "i") } }, { _id: 1 });
    console.log("Merchants found:", merchants.length);
    if (merchants.length === 0)
        return [];
    const merchantIds = merchants.map((m) => new mongoose_1.Types.ObjectId(m._id));
    console.log("Merchant IDs:", merchantIds);
    // 2️⃣ Find all promotions from these merchants
    let promotions = yield promotionMercent_model_1.Promotion.find({ merchantId: { $in: merchantIds } })
        .select("cardId name discountPercentage startDate endDate image status availableDays customerSegment")
        .lean();
    console.log("Total Promotions found:", promotions.length);
    // 3️⃣ Today & day
    const today = new Date();
    const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const todayDay = dayMap[today.getDay()];
    console.log("Today:", today.toDateString(), "Day:", todayDay);
    if (userId) {
        // 4️⃣ Logged-in user
        const activeUser = yield user_model_1.User.findById(userId).select("_id status");
        console.log("Active User:", activeUser);
        if (!activeUser || activeUser.status !== "active") {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not active");
        }
        // 5️⃣ User segment
        const userSegment = yield getUserSegment(userId);
        console.log("User Segment:", userSegment);
        // 6️⃣ User's digital cards
        const digitalCards = yield digitalCard_model_1.DigitalCard.find({ userId }).select("promotions");
        console.log("Digital Cards count:", digitalCards.length);
        const existingPromotionIds = digitalCards.flatMap(card => card.promotions
            .filter((p) => p.promotionId)
            .map((p) => p.promotionId.toString()));
        console.log("Existing Promotion IDs in user's cards:", existingPromotionIds);
        // 7️⃣ Filter promotions
        promotions = promotions.filter(promo => {
            const startDate = new Date(promo.startDate);
            const endDate = new Date(promo.endDate);
            const days = promo.availableDays || [];
            const isValidDate = today >= startDate && today <= endDate;
            const isValidDay = days.includes("all") || days.includes(todayDay);
            const isNotInUserCard = !existingPromotionIds.includes(promo._id.toString());
            const isSegmentMatch = !promo.customerSegment || ["all_customer", userSegment].includes(promo.customerSegment);
            const includePromo = promo.status === "active" && isValidDate && isValidDay && isNotInUserCard && isSegmentMatch;
            console.log(`Promo: ${promo.name}, Active: ${promo.status}, ValidDate: ${isValidDate}, ValidDay: ${isValidDay}, NotInCard: ${isNotInUserCard}, SegmentMatch: ${isSegmentMatch}, Include: ${includePromo}`);
            return includePromo;
        });
    }
    else {
        // 8️⃣ Guest user
        promotions = promotions.filter(promo => {
            const startDate = new Date(promo.startDate);
            const endDate = new Date(promo.endDate);
            const days = promo.availableDays || [];
            const isValidDate = today >= startDate && today <= endDate;
            const isValidDay = days.includes("all") || days.includes(todayDay);
            const isSegmentMatch = !promo.customerSegment || promo.customerSegment === "all_customer";
            const includePromo = promo.status === "active" && isValidDate && isValidDay && isSegmentMatch;
            console.log(`Guest Promo: ${promo.name}, Active: ${promo.status}, ValidDate: ${isValidDate}, ValidDay: ${isValidDay}, SegmentMatch: ${isSegmentMatch}, Include: ${includePromo}`);
            return includePromo;
        });
    }
    console.log("Filtered Promotions Count:", promotions.length);
    return promotions;
});
const sendNotificationToCustomer = (payload, merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const merchant = yield user_model_1.User.findById(merchantId).select("location");
    if (!merchant) {
        throw new Error("Merchant not found");
    }
    if (!((_a = merchant === null || merchant === void 0 ? void 0 : merchant.location) === null || _a === void 0 ? void 0 : _a.coordinates)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please update your location");
    }
    const lng = (_b = merchant === null || merchant === void 0 ? void 0 : merchant.location) === null || _b === void 0 ? void 0 : _b.coordinates[0];
    const lat = (_c = merchant === null || merchant === void 0 ? void 0 : merchant.location) === null || _c === void 0 ? void 0 : _c.coordinates[1];
    const merchantLocation = { lat, lng };
    const customers = yield (0, customerSegmentation_1.resolveCustomerIdsBySegment)({
        merchantId,
        segment: payload.segment,
        minPoints: payload.minPoints,
        radiusKm: payload.radiusKm,
        merchantLocation,
    });
    if (!customers.length)
        return { sent: 0 };
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: customers.map(c => c._id),
        title: "Promotion Alert",
        body: payload.message,
        type: notification_model_1.NotificationType.MANUAL,
        attachments: payload.attachment ? [payload.attachment] : [],
        channel: { socket: true, push: false },
    });
    return { sent: customers.length };
});
exports.PromotionService = {
    createPromotionToDB,
    updatePromotionToDB,
    getAllPromotionsFromDB,
    getSinglePromotionFromDB,
    deletePromotionFromDB,
    togglePromotionInDB,
    getPopularMerchantsFromDB,
    getDetailsOfMerchant,
    getUserTierOfMerchant,
    getPromotionsByUserCategory,
    getUserSegment,
    getAllPromotionsOfAMerchant,
    sendNotificationToCustomer,
    // getUserSegmentUpdate,
};
