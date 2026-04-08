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
exports.RatingController = void 0;
const rating_service_1 = require("./rating.service");
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
;
const addRating = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const { digitalCardId, promotionId, merchantId, rating, comment } = req.body;
    const userId = (_a = user._id) === null || _a === void 0 ? void 0 : _a.toString();
    if (!userId) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "User ID not found",
        });
    }
    const result = yield rating_service_1.RatingService.createRating(userId, digitalCardId, promotionId, merchantId, rating, comment);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Rating submitted successfully",
        data: result,
    });
}));
const getMerchantRatings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { merchantId } = req.params;
    const result = yield rating_service_1.RatingService.getMerchantRatings(merchantId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Ratings fetched successfully",
        data: result,
    });
}));
const getMerchantAverageRating = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { merchantId } = req.params;
    const result = yield rating_service_1.RatingService.getMerchantAverageRating(merchantId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant average rating retrieved successfully",
        data: result,
    });
}));
exports.RatingController = {
    addRating,
    getMerchantRatings,
    getMerchantAverageRating
};
