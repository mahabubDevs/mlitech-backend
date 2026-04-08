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
exports.PackageController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const package_service_1 = require("./package.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const createPackage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, description, price, duration, paymentType, features, credit, loginLimit } = req.body;
    if (!title || !(features === null || features === void 0 ? void 0 : features.length)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Title and features are required");
    }
    const payload = {
        title,
        description,
        price: Number(price),
        duration,
        paymentType,
        features,
        credit: Number(credit),
        loginLimit: Number(loginLimit),
        admin: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
    };
    const result = yield package_service_1.PackageService.createPackageToDB(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Package created Successfully",
        data: result
    });
}));
const updatePackage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield package_service_1.PackageService.updatePackageToDB(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Package updated Successfully",
        data: result
    });
}));
const getPackage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield package_service_1.PackageService.getPackageFromDB(req.query.paymentType);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Packages retrieved Successfully",
        data: result
    });
}));
const getSinglePackage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const packageId = req.params.id;
    const pkg = yield package_service_1.PackageService.getSinglePackageFromDB(packageId);
    if (!pkg) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: "Package not found",
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Package retrieved successfully",
        data: pkg,
    });
}));
const packageDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield package_service_1.PackageService.getPackageDetailsFromDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Package Details retrieved Successfully",
        data: result
    });
}));
const deletePackage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield package_service_1.PackageService.deletePackageToDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Package deleted Successfully",
        data: result
    });
}));
const togglePackageStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield package_service_1.PackageService.togglePackageStatusInDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Package status toggled Successfully",
        data: result
    });
}));
const getActivePackages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield package_service_1.PackageService.getActivePackagesFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Active packages retrieved Successfully",
        data: result
    });
}));
exports.PackageController = {
    createPackage,
    updatePackage,
    getPackage,
    getSinglePackage,
    packageDetails,
    deletePackage,
    togglePackageStatus,
    getActivePackages
};
