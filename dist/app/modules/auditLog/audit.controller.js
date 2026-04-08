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
exports.AuditController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const audit_service_1 = require("./audit.service");
const getAuditLogs = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const logs = yield audit_service_1.AuditService.getAllLogsExceptMerchant(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Audit logs retrieved successfully (merchant logs excluded)",
        data: logs,
    });
}));
const getAuditLogTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const logs = yield audit_service_1.AuditService.getAllLogsExceptMerchantTier(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Audit logs retrieved successfully (merchant logs excluded)",
        data: logs,
    });
}));
const getAuditLogsByUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 🔐 logged-in user
    const user = req.user;
    if (!(user === null || user === void 0 ? void 0 : user._id)) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: "Unauthorized user",
            data: null,
        });
    }
    const logs = yield audit_service_1.AuditService.getLogsByUserId(user._id, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User audit logs retrieved successfully",
        data: logs,
    });
}));
exports.AuditController = {
    getAuditLogs,
    getAuditLogsByUser,
    getAuditLogTier
};
