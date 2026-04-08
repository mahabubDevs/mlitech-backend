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
exports.MemberController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const mercentCustomerList_service_1 = require("./mercentCustomerList.service");
const getAllMembers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const merchantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const result = yield mercentCustomerList_service_1.MemberService.getAllMembers(merchantId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "All members fetched successfully",
        data: result.members,
        // pagination: result.pagination,
    });
}));
const getSingleMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const merchantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const userId = req.params.userId;
    const member = yield mercentCustomerList_service_1.MemberService.getSingleMember(merchantId, userId);
    if (!member) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 404,
            success: false,
            message: "Member not found",
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Member fetched successfully",
        data: member,
    });
}));
const getSingleMemberTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const merchantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const userId = req.params.id;
    const member = yield mercentCustomerList_service_1.MemberService.getSingleMemberTier(merchantId, userId);
    if (!member) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 404,
            success: false,
            message: "Member not found",
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Member fetched successfully",
        data: member,
    });
}));
exports.MemberController = {
    getAllMembers,
    getSingleMember,
    getSingleMemberTier,
};
