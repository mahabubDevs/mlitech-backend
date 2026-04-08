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
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const promotionAdmin_service_1 = require("./promotionAdmin.service");
const createPromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // data field থেকে JSON parse করো
    const bodyData = req.body.data ? JSON.parse(req.body.data) : {};
    console.log("REQ.BODY:", req.body);
    console.log("REQ.FILES:", req.files);
    const { name, customerReach, discountPercentage, promotionType, customerSegment, startDate, endDate, } = bodyData;
    if (!name || !customerSegment) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Name and Customer Segment are required");
    }
    const payload = {
        name,
        customerReach: Number(customerReach),
        discountPercentage: Number(discountPercentage),
        promotionType,
        customerSegment,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        image: req.files && req.files.image ? req.files.image[0].path : undefined,
        createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
    };
    const result = yield promotionAdmin_service_1.PromotionService.createPromotionToDB(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion created successfully",
        data: result
    });
}));
const getAllPromotions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionAdmin_service_1.PromotionService.getAllPromotionsFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotions retrieved successfully",
        data: result
    });
}));
const getSinglePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionAdmin_service_1.PromotionService.getSinglePromotionFromDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion retrieved successfully",
        data: result
    });
}));
const updatePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // data field থেকে parse করা (Option A: JSON string) 
    const bodyData = req.body.data ? JSON.parse(req.body.data) : Object.assign({}, req.body);
    // যদি image upload করা হয়ে থাকে
    if (req.files && req.files.image) {
        bodyData.image = req.files.image[0].path; // relative path
    }
    const result = yield promotionAdmin_service_1.PromotionService.updatePromotionToDB(req.params.id, bodyData);
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
    const result = yield promotionAdmin_service_1.PromotionService.deletePromotionFromDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion deleted successfully",
        data: result
    });
}));
const togglePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionAdmin_service_1.PromotionService.togglePromotionInDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: `Promotion ${result.isActive ? "activated" : "deactivated"} successfully`,
        data: result
    });
}));
exports.PromotionController = {
    createPromotion,
    getAllPromotions,
    getSinglePromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion
};
