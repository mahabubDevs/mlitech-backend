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
exports.FavoriteService = void 0;
const favorite_model_1 = require("./favorite.model");
const mongoose_1 = require("mongoose");
const toggleFavorite = (userId, merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield favorite_model_1.Favorite.findOne({
        userId: new mongoose_1.Types.ObjectId(userId),
        merchantId: new mongoose_1.Types.ObjectId(merchantId),
    });
    if (existing) {
        // ✅ Remove favorite (unfavorite)
        yield existing.deleteOne();
        return { isFavorite: false, merchantId };
    }
    else {
        // ✅ Add favorite
        const newFav = yield favorite_model_1.Favorite.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            merchantId: new mongoose_1.Types.ObjectId(merchantId),
        });
        return { isFavorite: true, merchantId };
    }
});
const getUserFavorites = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield favorite_model_1.Favorite.find({
        userId: new mongoose_1.Types.ObjectId(userId),
    })
        .populate({
        path: "merchantId", // Favorite model এ যেই ফিল্ডে userId reference আছে
        model: "User", // User model থেকে populate করবে
        select: "firstName email role businessName" // শুধু দরকারি field দেখাবে
    })
        .sort({ createdAt: -1 });
});
const removeFavorite = (userId, merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield favorite_model_1.Favorite.findOneAndDelete({
        userId: new mongoose_1.Types.ObjectId(userId),
        merchantId: new mongoose_1.Types.ObjectId(merchantId),
    });
    if (!result) {
        throw new Error("Favorite merchant not found");
    }
    return { message: "Unfavorited successfully" };
});
exports.FavoriteService = {
    toggleFavorite,
    getUserFavorites,
    removeFavorite,
};
