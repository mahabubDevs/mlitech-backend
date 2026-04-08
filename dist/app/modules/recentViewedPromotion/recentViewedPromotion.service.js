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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentViewedPromotionService = void 0;
const mongoose_1 = require("mongoose");
const recentViewedPromotion_model_1 = require("./recentViewedPromotion.model");
const digitalCard_model_1 = require("../customer/digitalCard/digitalCard.model");
const LIMIT = 10;
const addRecentViewedToDB = (userId, promotionId) => __awaiter(void 0, void 0, void 0, function* () {
    const pId = new mongoose_1.Types.ObjectId(promotionId);
    yield recentViewedPromotion_model_1.RecentViewedPromotion.updateOne({ userId }, { $pull: { items: pId } }, { upsert: true });
    const updated = yield recentViewedPromotion_model_1.RecentViewedPromotion.findOneAndUpdate({ userId }, {
        $push: {
            items: {
                $each: [pId],
                $position: 0,
            },
        },
    }, { upsert: true, new: true });
    if (updated.items.length > LIMIT) {
        updated.items = updated.items.slice(0, LIMIT);
        yield updated.save();
    }
    return updated;
});
const getRecentViewedFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const record = yield recentViewedPromotion_model_1.RecentViewedPromotion.findOne({ userId })
        .populate({
        path: "items",
        model: "PromotionMercent",
        populate: {
            path: "merchantId",
            model: "User",
            select: "website",
        },
    })
        .lean();
    if (!((_a = record === null || record === void 0 ? void 0 : record.items) === null || _a === void 0 ? void 0 : _a.length))
        return [];
    // 🔹 Get added promotions from digital card
    const digitalCard = yield digitalCard_model_1.DigitalCard.findOne({ userId }, { "promotions.promotionId": 1 }).lean();
    const addedPromotionIds = new Set(((_b = digitalCard === null || digitalCard === void 0 ? void 0 : digitalCard.promotions) === null || _b === void 0 ? void 0 : _b.map(p => p.promotionId.toString())) || []);
    // 🔹 Attach flag per promotion
    return record.items.map((promotion) => (Object.assign(Object.assign({}, promotion), { isPromotionAdded: addedPromotionIds.has(promotion._id.toString()) })));
});
exports.RecentViewedPromotionService = {
    addRecentViewedToDB,
    getRecentViewedFromDB,
};
