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
const favorite_service_1 = require("./favorite.service");
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const addFavorite = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const { merchantId } = req.body;
    const result = yield favorite_service_1.FavoriteService.toggleFavorite(((_a = user._id) === null || _a === void 0 ? void 0 : _a.toString()) || "", merchantId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.isFavorite
            ? "Merchant added to favorites"
            : "Merchant removed from favorites",
        data: result,
    });
}));
const getFavorites = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const result = yield favorite_service_1.FavoriteService.getUserFavorites(((_a = user._id) === null || _a === void 0 ? void 0 : _a.toString()) || "");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Favorite merchants fetched",
        data: result,
    });
}));
const removeFavorite = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const { merchantId } = req.params;
    const result = yield favorite_service_1.FavoriteService.removeFavorite(((_a = user._id) === null || _a === void 0 ? void 0 : _a.toString()) || "", merchantId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant removed from favorites",
        data: result,
    });
}));
exports.default = {
    addFavorite,
    getFavorites,
    removeFavorite,
};
