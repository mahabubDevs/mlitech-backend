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
exports.UserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const usermanagement_service_1 = require("./usermanagement.service");
const audit_service_1 = require("../auditLog/audit.service");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
// create user
const createUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const creator = req.user; // logged-in merchant or admin
    console.log("🚀 Creating user under merchant/admin:", req.body);
    const result = yield usermanagement_service_1.UserService.createUserToDB(req.body, creator);
    yield audit_service_1.AuditService.createLog(creator.email, "CREATE_USER", `User created: ${result.email} by ${creator.email}`);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: "User created successfully",
        data: result,
    });
}));
const createMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const creator = req.user; // logged-in user creating the merchant
    const result = yield usermanagement_service_1.UserService.createMerchantToDB(req.body, creator);
    // Audit log
    yield audit_service_1.AuditService.createLog(((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || "Unknown", "CREATE_MERCHANT", `Created merchant: ${result.email}, business: ${result.businessName}`);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: "Merchant created successfully",
        data: result,
    });
}));
// get all users
const getAllUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const requestingUserRole = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || "ADMIN";
    // pass query params
    const result = yield usermanagement_service_1.UserService.getAllUsersFromDB(requestingUserRole, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Users retrieved successfully",
        data: result,
    });
}));
// get single user
const getSingleUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield usermanagement_service_1.UserService.getSingleUserFromDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User retrieved successfully",
        data: result,
    });
}));
// update user
const updateUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield usermanagement_service_1.UserService.updateUserToDB(req.params.id, req.body);
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // Audit log
    yield audit_service_1.AuditService.createLog(((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || "Unknown", // যিনি update করেছে
    "UPDATE_USER", `Updated user: ${result.email}`);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User updated successfully",
        data: result,
    });
}));
// delete user
const deleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield usermanagement_service_1.UserService.deleteUserFromDB(req.params.id);
    // Audit log
    yield audit_service_1.AuditService.createLog(((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || "Unknown", "DELETE_USER", `Deleted user: ${req.params.id}`);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User deleted successfully",
        data: result,
    });
}));
// toggle user status
const toggleUserStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield usermanagement_service_1.UserService.toggleUserStatusFromDB(req.params.id);
    // Audit log
    yield audit_service_1.AuditService.createLog(((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || "Unknown", // action নেয়া user
    "TOGGLE_USER_STATUS", `Toggled status for user: ${result.email}, new status: ${result.status}`);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User status updated successfully",
        data: result,
    });
}));
const getAllMerchants = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield usermanagement_service_1.UserService.getAllMerchants(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "All merchants retrieved successfully",
        data: result.allmerchants,
        pagination: result.pagination,
    });
}));
const getSingleMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield usermanagement_service_1.UserService.getSingleMerchant(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant retrieved successfully",
        data: result,
    });
}));
const updateMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield usermanagement_service_1.UserService.updateMerchant(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant updated successfully",
        data: result,
    });
}));
const deleteMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield usermanagement_service_1.UserService.deleteMerchant(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant deleted successfully",
    });
}));
const toggleMerchantStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield usermanagement_service_1.UserService.toggleMerchantStatus(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant status updated successfully",
        data: result,
    });
}));
exports.UserController = {
    createUser,
    createMerchant,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getAllMerchants,
    getSingleMerchant,
    updateMerchant,
    deleteMerchant,
    toggleMerchantStatus,
};
