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
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const promotionAdmin_model_1 = require("./promotionAdmin.model");
// Create Promotion
const createPromotionToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const promotion = new promotionAdmin_model_1.Promotion(payload);
    return promotion.save();
});
// Update Promotion
const updatePromotionToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionAdmin_model_1.Promotion.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
});
// Get All Promotions with QueryBuilder
const getAllPromotionsFromDB = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const queryBuilder = new queryBuilder_1.default(promotionAdmin_model_1.Promotion.find(), query);
    queryBuilder
        .search(['title', 'description']) // searchable fields
        .filter()
        .sort()
        .paginate()
        .fields();
    const promotions = yield queryBuilder.modelQuery;
    const pagination = yield queryBuilder.getPaginationInfo();
    return { pagination, promotions };
});
// Get Single Promotion
const getSinglePromotionFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionAdmin_model_1.Promotion.findById(id);
});
// Delete Promotion
const deletePromotionFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return promotionAdmin_model_1.Promotion.findByIdAndDelete(id);
});
// Toggle Promotion Active/Inactive
const togglePromotionInDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const promotion = yield promotionAdmin_model_1.Promotion.findById(id);
    if (!promotion)
        return null;
    promotion.isActive = !promotion.isActive;
    return promotion.save();
});
exports.PromotionService = {
    createPromotionToDB,
    updatePromotionToDB,
    getAllPromotionsFromDB,
    getSinglePromotionFromDB,
    deletePromotionFromDB,
    togglePromotionInDB,
};
