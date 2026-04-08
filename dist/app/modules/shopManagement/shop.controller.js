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
exports.ShopController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const shop_service_1 = require("./shop.service");
const shop_validation_1 = require("./shop.validation");
// Admin: Create Shop
const createShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // সরাসরি req.body থেকে JSON নাও
    const payload = Object.assign(Object.assign({}, req.body), { createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
    // Validation
    const parsedPayload = shop_validation_1.createShopZodSchema.parse(payload);
    // Create in DB
    const result = yield shop_service_1.ShopService.createShopInDB(parsedPayload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: "Shop bundle created successfully",
        data: result,
    });
}));
// Admin: Update Shop
const updateShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let payloadData = {};
    // parse req.body.data if exists (JSON string)
    if (req.body.data) {
        try {
            payloadData = JSON.parse(req.body.data);
        }
        catch (_a) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid JSON in 'data' field");
        }
    }
    else {
        payloadData = req.body; // fallback
    }
    const payload = Object.assign({}, payloadData);
    // Validate
    const parsedPayload = shop_validation_1.updateShopZodSchema.parse(payload);
    // Update
    const result = yield shop_service_1.ShopService.updateShopInDB(req.params.id, parsedPayload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Shop bundle updated successfully",
        data: result,
    });
}));
// Admin: Delete Shop
const deleteShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shop_service_1.ShopService.deleteShopFromDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Shop bundle deleted successfully",
        data: result,
    });
}));
// Admin: Toggle Active/Block
const toggleShopStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shop_service_1.ShopService.toggleShopStatusInDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.status === "active" ? "Shop bundle activated" : "Shop bundle blocked",
        data: result,
    });
}));
// User/Admin: Get All Shops
const getShops = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shop_service_1.ShopService.getShopsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Shop bundles fetched successfully",
        data: result.data,
        pagination: result.pagination,
    });
}));
// User/Admin: Get Single Shop
const getSingleShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shop_service_1.ShopService.getSingleShopFromDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Shop bundle fetched successfully",
        data: result,
    });
}));
exports.ShopController = {
    createShop,
    updateShop,
    deleteShop,
    toggleShopStatus,
    getShops,
    getSingleShop,
};
