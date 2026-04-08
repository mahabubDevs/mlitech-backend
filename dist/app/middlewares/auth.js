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
const config_1 = __importDefault(require("../../config"));
const jwtHelper_1 = require("../../helpers/jwtHelper");
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const user_model_1 = require("../modules/user/user.model");
const auth = (...roles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenWithBearer = req.headers.authorization;
        if (!tokenWithBearer) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized');
        }
        // strip "Bearer " if present
        const token = tokenWithBearer.startsWith('Bearer ')
            ? tokenWithBearer.slice(7)
            : tokenWithBearer;
        // verify JWT token
        const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
        // ✅ Fetch user from DB
        const user = yield user_model_1.User.findById(verifyUser.id);
        if (!user) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not found');
        }
        // ✅ Single device check
        if (user.latestToken !== token) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are logged in from another device');
        }
        // 🔹 Attach user info to req for controllers
        req.user = {
            _id: user._id,
            role: user.role,
            email: user.email,
            isSubMerchant: user.isSubMerchant,
            merchantId: user.merchantId,
        };
        // ✅ Role-based access
        if (roles.length && !roles.includes(user.role)) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this API");
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.default = auth;
