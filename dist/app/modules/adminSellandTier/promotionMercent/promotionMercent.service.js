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
;
const mongoose_1 = require("mongoose");
const mercentSellManagement_model_1 = require("../../mercent/mercentSellManagement/mercentSellManagement.model");
const generatePromotionCode = (length = 6) => {
    const chars = "0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `AP-${code}`; // Prefix CP
};
const createPromotionToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Auto-generate cardId if not provided
    if (!payload.cardId) {
        payload.cardId = generatePromotionCode(6);
    }
    const promotion = new promotionMercent_model_1.PromotionAdmin(payload);
    return promotion.save();
});
const updatePromotionToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionMercent_model_1.PromotionAdmin.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
});
const getAllPromotionsFromDB = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const queryBuilder = new queryBuilder_1.default(promotionMercent_model_1.PromotionAdmin.find({}).populate("merchantId", "website"), query);
    queryBuilder.search(["name"]).filter().sort().paginate().fields();
    const promotions = yield queryBuilder.modelQuery;
    const pagination = yield queryBuilder.getPaginationInfo();
    return { pagination, promotions };
});
const getAllPromotionsOfAMerchant = (merchantId_1, ...args_1) => __awaiter(void 0, [merchantId_1, ...args_1], void 0, function* (merchantId, query = {}) {
    const queryBuilder = new queryBuilder_1.default(promotionMercent_model_1.PromotionAdmin.find({ merchantId }).populate("merchantId", "website"), query);
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
    const purchases = yield mercentSellManagement_model_1.Sell.find({ userId, status: "completed" }).sort({ createdAt: -1 });
    const totalPurchases = purchases.length;
    const last6MonthsPurchases = purchases.filter(p => new Date(p.createdAt) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000));
    const totalSpend = purchases.reduce((sum, p) => sum + p.totalBill, 0);
    const avgSpend = 1000;
    let segment;
    if (totalPurchases === 0 || (totalPurchases === 1 && purchases[0].createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) {
        segment = "new_customer";
    }
    else if (totalPurchases >= 2 && last6MonthsPurchases.length < 5) {
        segment = "returning_customer";
    }
    else if (last6MonthsPurchases.length >= 5 || totalSpend >= 1.5 * avgSpend) {
        segment = "loyal_customer";
    }
    else if (last6MonthsPurchases.length >= 20 || totalSpend >= 3 * avgSpend) {
        segment = "vip_customer";
    }
    else {
        segment = "all_customer";
    }
    return segment; // ✅ শুধু string
});
const getSinglePromotionFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionMercent_model_1.PromotionAdmin.findById(id);
});
const deletePromotionFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionMercent_model_1.PromotionAdmin.findByIdAndDelete(id);
});
const togglePromotionInDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const promotion = yield promotionMercent_model_1.PromotionAdmin.findById(id);
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
                merchant: {
                    name: 1,
                    email: 1,
                    profile: 1,
                },
            },
        },
    ]);
    if (result.length === 0) {
        return [
            {
                _id: "690edfe0180ea2417f4b470d",
                avgRating: 4.5,
                totalRatings: 12,
                merchant: {
                    name: "Demo Merchant One",
                    email: "merchant1@example.com",
                    profile: "demo1.jpg",
                },
            },
            {
                _id: "demo-merchant-2",
                avgRating: 4.2,
                totalRatings: 9,
                merchant: {
                    name: "Demo Merchant Two",
                    email: "merchant2@example.com",
                    profile: "demo2.jpg",
                },
            },
        ];
    }
    return result;
});
const getDetailsOfMerchant = (merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield user_model_1.User.findById(merchantId)
        .select("firstName location profile photo about website address")
        .lean();
    const promotions = yield promotionMercent_model_1.PromotionAdmin.find({ merchantId })
        .select("cardId name discountPercentage startDate endDate image status")
        .lean();
    return {
        merchant,
        promotions,
    };
});
const getUserTierOfMerchant = (userId, merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // 1. Get user's digital card (points)
    const digitalCard = yield digitalCard_model_1.DigitalCard.findOne({
        userId,
        merchantId,
    }).select("availablePoints");
    if (!digitalCard) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User has no digital card with this merchant");
    }
    const availablePoints = (_a = digitalCard.availablePoints) !== null && _a !== void 0 ? _a : 0;
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
            availablePoints,
            totalSpend,
            tierName: null,
            rewardText: null,
        };
    }
    // 4. Determine user's tier based on both conditions
    let userTier = null;
    for (const tier of tiers) {
        const meetsPoints = availablePoints >= tier.pointsThreshold;
        const meetsSpend = totalSpend >= tier.minTotalSpend;
        if (meetsPoints && meetsSpend) {
            userTier = tier; // keep looping to get the highest eligible tier
        }
    }
    return {
        availablePoints,
        tierName: (_b = userTier === null || userTier === void 0 ? void 0 : userTier.name) !== null && _b !== void 0 ? _b : null,
        rewardText: (_c = userTier === null || userTier === void 0 ? void 0 : userTier.reward) !== null && _c !== void 0 ? _c : null,
    };
});
//catagory based promotion fetching
const getPromotionsByUserCategory = (categoryName) => __awaiter(void 0, void 0, void 0, function* () {
    if (!categoryName) {
        throw new Error("Category name is required");
    }
    // 1. Find all merchants with same category
    const merchants = yield user_model_1.User.find({
        service: { $regex: new RegExp(categoryName, "i") }, // case-insensitive
    }, { _id: 1 });
    if (merchants.length === 0) {
        return []; // no merchant found
    }
    const merchantIds = merchants.map((m) => new mongoose_1.Types.ObjectId(m._id));
    // 2. Find all promotions from these merchants
    const promotions = yield promotionMercent_model_1.PromotionAdmin.find({
        merchantId: { $in: merchantIds },
    }).sort({ createdAt: -1 }); // newest first
    return promotions;
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
};
