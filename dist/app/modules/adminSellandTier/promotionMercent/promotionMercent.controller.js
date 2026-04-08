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
exports.PromotionController = void 0;
const http_status_codes_1 = require("http-status-codes");
const promotionMercent_service_1 = require("./promotionMercent.service");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const ApiErrors_1 = __importDefault(require("../../../../errors/ApiErrors"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const promotionAdmin_model_1 = require("../../promotionAdmin/promotionAdmin.model");
// import { Promotion } from "./promotionMercent.model";
const createPromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // body data parse
    const bodyData = req.body.data ? JSON.parse(req.body.data) : {};
    const { name, discountPercentage, promotionType, customerSegment, startDate, availableDays, endDate, } = bodyData;
    if (!name || !customerSegment || !promotionType) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Required fields missing");
    }
    // IMAGE URL
    let imageUrl = undefined;
    if (req.files && req.files.image && req.files.image[0]) {
        const file = req.files.image[0];
        const fileName = file.filename;
        imageUrl = `/images/${fileName}`;
    }
    // MERCHANT ID from request.user (auth middleware sets req.user)
    const merchantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!merchantId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Merchant ID not found");
    }
    const payload = {
        name,
        discountPercentage: Number(discountPercentage),
        promotionType,
        customerSegment,
        startDate: new Date(startDate),
        availableDays,
        endDate: new Date(endDate),
        image: imageUrl,
        merchantId, // ✅ save merchantId in DB
    };
    const result = yield promotionMercent_service_1.PromotionService.createPromotionToDB(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion created successfully",
        data: result,
    });
}));
const getAllPromotions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.getAllPromotionsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotions retrieved successfully",
        data: result.promotions,
        pagination: result.pagination,
    });
}));
const getAllPromotionsOfAMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield promotionMercent_service_1.PromotionService.getAllPromotionsOfAMerchant(user._id, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotions retrieved successfully",
        data: result.promotions,
        pagination: result.pagination,
    });
}));
const getPromotionsForUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User ID not found");
    }
    const userSegment = yield promotionMercent_service_1.PromotionService.getUserSegment(userId);
    const promotions = yield promotionAdmin_model_1.Promotion.find({
        customerSegment: { $in: [userSegment, "all_customer"] },
        status: "active"
    }).populate("merchantId", "website name");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotions retrieved successfully for user",
        data: promotions,
    });
}));
const getSinglePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.getSinglePromotionFromDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion retrieved successfully",
        data: result,
    });
}));
const updatePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bodyData = req.body.data ? JSON.parse(req.body.data) : Object.assign({}, req.body);
    const payload = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (bodyData.name && { name: bodyData.name })), (bodyData.discountPercentage && {
        discountPercentage: Number(bodyData.discountPercentage),
    })), (bodyData.promotionType && { promotionType: bodyData.promotionType })), (bodyData.customerSegment && {
        customerSegment: bodyData.customerSegment,
    })), (bodyData.startDate && { startDate: new Date(bodyData.startDate) })), (bodyData.endDate && { endDate: new Date(bodyData.endDate) })), (bodyData.availableDays && {
        availableDays: Array.isArray(bodyData.availableDays)
            ? bodyData.availableDays
            : [bodyData.availableDays],
    }));
    // ✅ Fix Image URL Format (same as create)
    if (req.files && req.files.image && req.files.image[0]) {
        const file = req.files.image[0];
        const fileName = file.filename;
        payload.image = `/images/${fileName}`;
    }
    const result = yield promotionMercent_service_1.PromotionService.updatePromotionToDB(req.params.id, payload);
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion updated successfully",
        data: result,
    });
}));
const deletePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.deletePromotionFromDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion deleted successfully",
        data: result,
    });
}));
const togglePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.togglePromotionInDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: `Promotion toggled successfully`,
        data: result,
    });
}));
const getPopularMerchants = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.getPopularMerchantsFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Popular merchants fetched successfully",
        data: result,
    });
}));
const getDetailsOfMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.getDetailsOfMerchant(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchants details fetched successfully",
        data: result,
    });
}));
const getUserTierOfMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield promotionMercent_service_1.PromotionService.getUserTierOfMerchant(user._id, req.body.merchantId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User Tier of Merchant fetched successfully",
        data: result,
    });
}));
//catagory show pro
const getPromotionsByUserCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryName } = req.query; // user sends ?categoryName=restaurant
    const promotions = yield promotionMercent_service_1.PromotionService.getPromotionsByUserCategory(String(categoryName));
    res.status(200).json({
        success: true,
        message: "Promotions fetched successfully",
        data: promotions,
    });
}));
exports.PromotionController = {
    createPromotion,
    getAllPromotions,
    getSinglePromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion,
    getPopularMerchants,
    getDetailsOfMerchant,
    getUserTierOfMerchant,
    getPromotionsByUserCategory,
    getPromotionsForUser,
    getAllPromotionsOfAMerchant,
};
