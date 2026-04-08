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
exports.TierController = void 0;
const http_status_codes_1 = require("http-status-codes");
const tier_service_1 = require("./tier.service");
const tier_validation_1 = require("./tier.validation");
const tier_model_1 = require("./tier.model");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const ApiErrors_1 = __importDefault(require("../../../../errors/ApiErrors"));
const queryBuilder_1 = __importDefault(require("../../../../util/queryBuilder"));
const audit_service_1 = require("../../auditLog/audit.service");
const createTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const validatedBody = yield tier_validation_1.createTierSchema.parseAsync(Object.assign(Object.assign({}, req.body), { pointsThreshold: Number(req.body.pointsThreshold), minTotalSpend: Number(req.body.minTotalSpend), isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : undefined }));
    const payload = Object.assign(Object.assign({}, validatedBody), { admin: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, isActive: (_b = validatedBody.isActive) !== null && _b !== void 0 ? _b : true });
    const result = yield tier_service_1.TierService.createTierToDB(payload);
    // -----------------------------
    // 3️⃣ Audit Log
    // -----------------------------
    yield audit_service_1.AuditService.createLog((_c = req.user) === null || _c === void 0 ? void 0 : _c._id, "CREATE_TIER", `Tier "${result.name}" created`);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Tier created successfully",
        data: result,
    });
}));
const updateTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const body = req.body.data ? JSON.parse(req.body.data) : req.body;
    const validatedBody = yield tier_validation_1.updateTierSchema.parseAsync(body);
    const payload = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (validatedBody.name && { name: validatedBody.name })), (validatedBody.pointsThreshold !== undefined && { pointsThreshold: Number(validatedBody.pointsThreshold) })), (validatedBody.reward && { reward: validatedBody.reward })), (validatedBody.accumulationRule && { accumulationRule: validatedBody.accumulationRule })), (validatedBody.redemptionRule && { redemptionRule: validatedBody.redemptionRule })), (validatedBody.minTotalSpend !== undefined && { minTotalSpend: Number(validatedBody.minTotalSpend) })), (validatedBody.isActive !== undefined && { isActive: Boolean(validatedBody.isActive) }));
    const result = yield tier_service_1.TierService.updateTierToDB(req.params.id, payload);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Tier not found");
    yield audit_service_1.AuditService.createLog((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, "UPDATE_TIER", `Tier "${result.name}" updated`);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Tier updated successfully",
        data: result,
    });
}));
const getTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Build the query
    const queryBuilder = new queryBuilder_1.default(tier_model_1.Tier.find(), Object.assign(Object.assign({}, req.query), { admin: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }));
    // Apply query builder features
    queryBuilder
        .search(['name', 'description']) // searchable fields in Tier
        .filter()
        .sort()
        .paginate()
        .fields();
    // Execute query
    const tiers = yield queryBuilder.modelQuery;
    // Get pagination info
    const pagination = yield queryBuilder.getPaginationInfo();
    // Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Tiers retrieved successfully",
        data: tiers,
        pagination,
    });
}));
const getSingleTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield tier_service_1.TierService.getSingleTierFromDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Tier not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Tier retrieved successfully",
        data: result,
    });
}));
const deleteTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield tier_service_1.TierService.deleteTierToDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Tier not found");
    // -----------------------------
    // 1️⃣ Audit Log
    // -----------------------------
    yield audit_service_1.AuditService.createLog((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, "DELETE_TIER", `Tier "${result.name}" deleted`);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Tier deleted successfully",
        data: result,
    });
}));
exports.TierController = {
    createTier,
    updateTier,
    getTier,
    getSingleTier,
    deleteTier,
};
