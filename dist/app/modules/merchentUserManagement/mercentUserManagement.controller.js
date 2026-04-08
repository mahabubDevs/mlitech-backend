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
exports.MercentUserManagementController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const mercentUserManagement_service_1 = require("./mercentUserManagement.service");
// ---------------- Create User ----------------
const createUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield mercentUserManagement_service_1.UserService.createUserToDB(req.body, req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: "User created successfully",
        data: result,
    });
}));
// ---------------- Get Merchant's Own Users ----------------
const getMyUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { users, paginationInfo } = yield mercentUserManagement_service_1.UserService.getUsersByMerchant(req.user, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Users fetched successfully",
        data: { users, paginationInfo },
    });
}));
// ---------------- Get Single User ----------------
const getSingleUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield mercentUserManagement_service_1.UserService.getSingleUser(req.params.id, req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User fetched successfully",
        data: user,
    });
}));
// ---------------- Update User ----------------
const updateUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedUser = yield mercentUserManagement_service_1.UserService.updateUser(req.params.id, req.body, req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User updated successfully",
        data: updatedUser,
    });
}));
// ---------------- Delete User ----------------
const deleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("===== deleteUser CONTROLLER START =====");
    console.log("Params:", req.params);
    console.log("Logged in user:", req.user);
    yield mercentUserManagement_service_1.UserService.deleteUser(req.params.id, req.user);
    console.log("Sending success response");
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User deleted successfully",
    });
    console.log("===== deleteUser CONTROLLER END =====");
}));
// ---------------- Toggle Status ----------------
const toggleUserStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield mercentUserManagement_service_1.UserService.toggleUserStatus(req.params.id, req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User status updated successfully",
        data: result,
    });
}));
exports.MercentUserManagementController = {
    createUser,
    getMyUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
};
