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
exports.canAccessMerchantProfile = void 0;
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const user_model_1 = require("../modules/user/user.model");
const canAccessMerchantProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const reqUser = req.user;
        // If params userId exists (single profile route)
        const profileUserId = req.params.userId;
        if (profileUserId) {
            const profileUser = yield user_model_1.User.findById(profileUserId);
            if (!profileUser)
                throw new ApiErrors_1.default(404, 'User not found');
            // Admin always access
            if (reqUser.role === 'ADMIN')
                return next();
            // Root Merchant
            if (reqUser.role === 'MERCENT' && !reqUser.isSubMerchant) {
                if (((_a = profileUser.merchantId) === null || _a === void 0 ? void 0 : _a.toString()) === reqUser._id.toString())
                    return next();
            }
            // Staff
            if (reqUser.isSubMerchant) {
                if (reqUser._id.toString() === profileUser._id.toString())
                    return next(); // own profile
                if (profileUser._id.toString() === ((_b = reqUser.merchantId) === null || _b === void 0 ? void 0 : _b.toString()))
                    return next(); // root merchant profile
            }
            throw new ApiErrors_1.default(403, 'You cannot access this profile');
        }
        // If no params -> token-only route
        // Example: dashboard / tiers list
        // console.log('[ACCESS LOG] No userId param, access allowed based on token only', {
        //   _id: reqUser._id.toString(),
        //   role: reqUser.role,
        //   isSubMerchant: reqUser.isSubMerchant,
        //   merchantId: reqUser.merchantId?.toString(),
        // });
        next(); // allow access
    }
    catch (err) {
        next(err);
    }
});
exports.canAccessMerchantProfile = canAccessMerchantProfile;
