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
exports.TierService = void 0;
const tier_model_1 = require("./tier.model");
const createTierToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const tier = new tier_model_1.Tier(payload);
    return tier.save();
});
const updateTierToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return tier_model_1.Tier.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
});
const getTierFromDB = (adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {};
    if (adminId)
        query.admin = adminId;
    return tier_model_1.Tier.find(query).sort({ pointsThreshold: 1 });
});
const getSingleTierFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return tier_model_1.Tier.findById(id);
});
const deleteTierToDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return tier_model_1.Tier.findByIdAndDelete(id);
});
exports.TierService = {
    createTierToDB,
    updateTierToDB,
    getTierFromDB,
    getSingleTierFromDB,
    deleteTierToDB,
};
