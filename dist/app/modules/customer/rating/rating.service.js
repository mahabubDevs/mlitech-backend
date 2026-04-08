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
exports.RatingService = void 0;
const mongoose_1 = require("mongoose");
const digitalCard_model_1 = require("../digitalCard/digitalCard.model");
const rating_model_1 = require("./rating.model");
const createRating = (userId, digitalCardId, promotionId, merchantId, rating, comment) => __awaiter(void 0, void 0, void 0, function* () {
    // user এর কার্ড কি সত্যিই আছে?
    const card = yield digitalCard_model_1.DigitalCard.findOne({
        _id: new mongoose_1.Types.ObjectId(digitalCardId),
        userId: new mongoose_1.Types.ObjectId(userId)
    });
    if (!card) {
        throw new Error("Digital card not found for user");
    }
    // // আগের রেটিং check
    // const alreadyRated = await Rating.findOne({
    //   userId: new Types.ObjectId(userId),
    //   promotionId: new Types.ObjectId(promotionId),
    // });
    // if (alreadyRated) {
    //   throw new Error("You already rated this promotion");
    // }
    // rating create
    const create = yield rating_model_1.Rating.create({
        userId: new mongoose_1.Types.ObjectId(userId),
        merchantId: new mongoose_1.Types.ObjectId(merchantId),
        promotionId: new mongoose_1.Types.ObjectId(promotionId),
        digitalCardId: new mongoose_1.Types.ObjectId(digitalCardId),
        rating,
        comment,
    });
    return create;
});
const getMerchantRatings = (merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield rating_model_1.Rating.find({
        merchantId: new mongoose_1.Types.ObjectId(merchantId),
    }).sort({ createdAt: -1 });
});
const getMerchantAverageRating = (merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(merchantId)) {
        throw new Error("Invalid merchant ID");
    }
    const result = yield rating_model_1.Rating.aggregate([
        { $match: { merchantId: new mongoose_1.Types.ObjectId(merchantId) } },
        {
            $group: {
                _id: "$merchantId",
                averageRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 },
            },
        },
    ]);
    return result[0] || { averageRating: 0, totalRatings: 0 };
});
exports.RatingService = {
    createRating,
    getMerchantRatings,
    getMerchantAverageRating
};
