"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.MemberService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const user_model_1 = require("../../user/user.model");
const queryBuilder_1 = __importDefault(require("../../../../util/queryBuilder"));
const promotionMercent_model_1 = require("../promotionMercent/promotionMercent.model");
const digitalCard_model_1 = require("../../customer/digitalCard/digitalCard.model");
const ApiErrors_1 = __importDefault(require("../../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const mercentSellManagement_model_1 = require("../mercentSellManagement/mercentSellManagement.model");
const tier_model_1 = require("../point&TierSystem/tier.model");
const getAllMembers = (merchantId, query) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Get unique buyer IDs from DigitalCard (correct source)
    const buyerIds = yield digitalCard_model_1.DigitalCard.distinct("userId", {
        merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
    });
    if (!buyerIds.length) {
        return {
            members: [],
            pagination: {
                total: 0,
                page: Number(query.page) || 1,
                limit: Number(query.limit) || 20,
                pages: 0,
            },
        };
    }
    // 2️⃣ Query Builder for members
    const qb = new queryBuilder_1.default(user_model_1.User.find({ _id: { $in: buyerIds } }).select("firstName location status "), query)
        .search(["firstName", "lastName", "email", "phone"])
        .filter()
        .sort()
        .paginate()
        .fields();
    const members = yield qb.modelQuery.lean();
    const pagination = yield qb.getPaginationInfo();
    // 3️⃣ Get digital cards for these users under this merchant
    const digitalCards = yield digitalCard_model_1.DigitalCard.find({
        userId: { $in: buyerIds },
        merchantId,
    })
        .select("cardCode availablePoints promotions")
        .lean();
    // 4️⃣ Attach cards to each member
    const membersWithCards = members.map((member) => (Object.assign(Object.assign({}, member), { digitalCards: digitalCards.filter((dc) => (dc.userId && dc.userId.toString()) === member._id.toString()) })));
    return {
        members: membersWithCards,
        pagination,
    };
});
const getSingleMember = (merchantId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user bought gift card from merchant
    const bought = yield promotionMercent_model_1.Promotion.findOne({
        merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
        userId: new mongoose_1.default.Types.ObjectId(userId),
    });
    if (!bought)
        return null;
    const member = yield user_model_1.User.findById(userId)
        .select("firstName lastName email phone")
        .lean();
    const digitalCards = yield digitalCard_model_1.DigitalCard.find({ userId, merchantId })
        .select("uniqueId totalPoints expiry")
        .lean();
    return Object.assign(Object.assign({}, member), { digitalCards });
});
const getSingleMemberTier = (merchantId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // 1️⃣ Get user's digital card (points)
    const digitalCard = yield digitalCard_model_1.DigitalCard.findOne({
        userId,
        merchantId,
    }).select("availablePoints lifeTimeEarnPoints"); // lifetime points ও নেওয়া
    if (!digitalCard) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User has no digital card with this merchant");
    }
    const availablePoints = (_a = digitalCard.availablePoints) !== null && _a !== void 0 ? _a : 0; // current points
    const lifetimePoints = (_b = digitalCard.lifeTimeEarnPoints) !== null && _b !== void 0 ? _b : 0; // lifetime points for tier
    // 2️⃣ Calculate total spent for this merchant
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
    // 3️⃣ Get merchant tiers
    const tiers = yield tier_model_1.Tier.find({ admin: merchantId }).sort({
        pointsThreshold: 1, // pointsThreshold = lifetime points needed
        minTotalSpend: 1,
    });
    if (!tiers.length) {
        return {
            availablePoints,
            lifetimePoints,
            tierName: "No tier Found",
        };
    }
    // 4️⃣ Determine user's tier based on lifetime points
    let userTier = null;
    for (const tier of tiers) {
        const meetsPoints = lifetimePoints >= tier.pointsThreshold; // lifetime points check
        const meetsSpend = totalSpend >= tier.minTotalSpend;
        if (meetsPoints && meetsSpend) {
            userTier = tier; // keep looping to get the highest eligible tier
        }
    }
    return {
        availablePoints, // current points
        lifetimePoints, // lifetime points
        tierName: (_c = userTier === null || userTier === void 0 ? void 0 : userTier.name) !== null && _c !== void 0 ? _c : "No tier Found",
    };
});
exports.MemberService = {
    getAllMembers,
    getSingleMember,
    getSingleMemberTier,
};
