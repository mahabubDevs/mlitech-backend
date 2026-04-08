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
const mercentSellManagement_model_1 = require("../mercentSellManagement/mercentSellManagement.model");
const user_model_1 = require("../../user/user.model");
const notificationsHelper_1 = require("../../../../helpers/notificationsHelper");
const notification_model_1 = require("../../notification/notification.model");
const createTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    console.log("🟢 User ID from token:", user._id);
    // ✅ Decide which ID to use
    const filterId = user.isSubMerchant ? user.merchantId : user._id;
    console.log("🟢 Merchant/Sub-Merchant ID:", filterId);
    // -----------------------------
    // Fetch full user from DB to get businessName
    // -----------------------------
    const fullUser = yield user_model_1.User.findById(filterId).select("_id firstName businessName");
    console.log("🟢 Full User from DB:", fullUser);
    // -----------------------------
    // 1️⃣ Validate Body
    // -----------------------------
    const validatedBody = yield tier_validation_1.createTierSchema.parseAsync(Object.assign(Object.assign({}, req.body), { pointsThreshold: Number(req.body.pointsThreshold), minTotalSpend: Number(req.body.minTotalSpend), isActive: req.body.isActive !== undefined
            ? Boolean(req.body.isActive)
            : undefined }));
    console.log("🟢 Validated Body:", validatedBody);
    // -----------------------------
    // Allowed Tier Names
    // -----------------------------
    const ALLOWED_TIERS = [
        "Gold Basic",
        "Gold Plus",
        "Platinum",
        "Platinum Plus",
        "Diamond",
    ];
    // ❌ Invalid Tier Name
    if (!ALLOWED_TIERS.includes(validatedBody.name)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid tier name. Allowed tiers: Gold Basic, Gold Plus, Platinum, Platinum Plus, Diamond");
    }
    // -----------------------------
    // Prevent Duplicate Tier Name
    // -----------------------------
    const existingTier = yield tier_model_1.Tier.findOne({
        admin: filterId,
        name: validatedBody.name,
    });
    if (existingTier) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Tier "${validatedBody.name}" already exists for this merchant`);
    }
    // 🔥 Gold Basic validation
    if (validatedBody.name === "Gold Basic") {
        if (validatedBody.pointsThreshold !== 0) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Gold Basic tier must have pointsThreshold = 0");
        }
        if (Number(validatedBody.reward) !== 0) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Gold Basic tier must have reward = 0");
        }
    }
    const payload = Object.assign(Object.assign({}, validatedBody), { admin: filterId, isActive: (_a = validatedBody.isActive) !== null && _a !== void 0 ? _a : true, reward: validatedBody.pointsThreshold === 0
            ? "0"
            : String(validatedBody.reward) });
    console.log("🟢 Payload to DB:", payload);
    // -----------------------------
    // 2️⃣ Save Tier to DB
    // -----------------------------
    const result = yield tier_service_1.TierService.createTierToDB(payload);
    console.log("💾 Tier Saved:", result);
    // -----------------------------
    // 3️⃣ Audit Log
    // -----------------------------
    yield audit_service_1.AuditService.createLog(user._id, "CREATE_TIER", `Tier "${result.name}" created`);
    console.log("📝 Audit Log Created");
    // -----------------------------
    // 4️⃣ Send Notifications to Merchant's Customers (Sell model)
    // -----------------------------
    const customerIds = yield mercentSellManagement_model_1.Sell.find({ merchantId: filterId, status: "completed" })
        .distinct("userId"); // only unique customer IDs
    console.log("📋 Found Customer IDs:", customerIds);
    if (customerIds === null || customerIds === void 0 ? void 0 : customerIds.length) {
        const customers = yield user_model_1.User.find({ _id: { $in: customerIds } })
            .select("_id firstName socketIds");
        console.log("👥 Customers fetched:", customers.map(c => c._id));
        const ids = customers.map((c) => c._id.toString());
        yield (0, notificationsHelper_1.sendNotification)({
            userIds: ids,
            title: "New Tier Available!",
            body: `Merchant ${fullUser === null || fullUser === void 0 ? void 0 : fullUser.businessName} has created a new tier: "${result.name}". Check it out now!`,
            type: notification_model_1.NotificationType.MANUAL,
            channel: { socket: true, push: true },
        });
        console.log("🔔 Notifications Sent to Customers");
    }
    else {
        console.log("⚠️ No customers to notify");
    }
    // -----------------------------
    // 5️⃣ Send Response
    // -----------------------------
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Tier created successfully",
        data: result,
    });
    console.log("✅ Response sent to client");
}));
const updateTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    console.log("🟢 User ID from token:", user._id);
    // -----------------------------
    // 1️⃣ Parse and Validate Body
    // -----------------------------
    const body = req.body.data ? JSON.parse(req.body.data) : req.body;
    const validatedBody = yield tier_validation_1.updateTierSchema.parseAsync(body);
    console.log("🟢 Validated Body:", validatedBody);
    // 🔥 Gold Basic validation (UPDATE)
    if (validatedBody.name === "Gold Basic" &&
        ((validatedBody.pointsThreshold !== undefined && validatedBody.pointsThreshold !== 0) ||
            (validatedBody.reward !== undefined && Number(validatedBody.reward) !== 0))) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Gold Basic must have pointsThreshold = 0 and reward = 0");
    }
    // -----------------------------
    // 2️⃣ Prepare Payload with reward logic
    // -----------------------------
    const payload = Object.assign(Object.assign({}, (validatedBody.name && { name: validatedBody.name })), (validatedBody.pointsThreshold !== undefined && { pointsThreshold: Number(validatedBody.pointsThreshold) }));
    // 🔹 pointsThreshold === 0 হলে reward > 0 দেওয়া যাবে না
    // 🔹 pointsThreshold === 0 হলে reward > 0 দেওয়া যাবে না
    if (validatedBody.pointsThreshold === 0 &&
        validatedBody.reward !== undefined &&
        Number(validatedBody.reward) > 0) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Reward cannot be more than 0 for pointsThreshold 0");
    }
    // 🔹 reward ঠিক করা
    if (validatedBody.reward !== undefined) {
        payload.reward = validatedBody.pointsThreshold === 0 ? 0 : validatedBody.reward;
    }
    if (validatedBody.accumulationRule)
        payload.accumulationRule = validatedBody.accumulationRule;
    if (validatedBody.redemptionRule)
        payload.redemptionRule = validatedBody.redemptionRule;
    if (validatedBody.minTotalSpend !== undefined)
        payload.minTotalSpend = Number(validatedBody.minTotalSpend);
    if (validatedBody.isActive !== undefined)
        payload.isActive = Boolean(validatedBody.isActive);
    console.log("🟢 Payload to DB:", payload);
    // -----------------------------
    // 3️⃣ Update Tier in DB
    // -----------------------------
    const result = yield tier_service_1.TierService.updateTierToDB(req.params.id, payload);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Tier not found");
    console.log("💾 Tier Updated:", result);
    // -----------------------------
    // 4️⃣ Audit Log
    // -----------------------------
    yield audit_service_1.AuditService.createLog(user._id, "UPDATE_TIER", `Tier "${result.name}" updated`);
    console.log("📝 Audit Log Created");
    // -----------------------------
    // 5️⃣ Send Notifications to Merchant's Customers
    // -----------------------------
    const filterId = user.isSubMerchant ? user.merchantId : user._id;
    const fullUser = yield user_model_1.User.findById(filterId).select("_id firstName businessName");
    console.log("🟢 Full User from DB:", fullUser);
    const customerIds = yield mercentSellManagement_model_1.Sell.find({ merchantId: filterId, status: "completed" })
        .distinct("userId");
    console.log("📋 Found Customer IDs:", customerIds);
    if (customerIds === null || customerIds === void 0 ? void 0 : customerIds.length) {
        const customers = yield user_model_1.User.find({ _id: { $in: customerIds } })
            .select("_id firstName socketIds");
        console.log("👥 Customers fetched:", customers.map(c => c._id));
        const ids = customers.map((c) => c._id.toString());
        yield (0, notificationsHelper_1.sendNotification)({
            userIds: ids,
            title: "Tier Updated!",
            body: `Merchant ${fullUser === null || fullUser === void 0 ? void 0 : fullUser.businessName} has updated a tier: "${result.name}". Check it out now!`,
            type: notification_model_1.NotificationType.MANUAL,
            channel: { socket: true, push: true },
        });
        console.log(`🔔 Notifications Sent to ${customers.length} Customers`);
    }
    else {
        console.log("⚠️ No customers to notify");
    }
    // -----------------------------
    // 6️⃣ Send Response
    // -----------------------------
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Tier updated successfully",
        data: result,
    });
    console.log("✅ Response sent to client");
}));
const getTier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // ✅ Decide which ID to use for filtering
    const filterId = user.isSubMerchant ? user.merchantId : user._id;
    // Build the query
    const queryBuilder = new queryBuilder_1.default(tier_model_1.Tier.find(), Object.assign(Object.assign({}, req.query), { admin: filterId }));
    // Apply query builder features
    queryBuilder
        .search(["name", "description"])
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
    // ✅ Audit Log creation
    yield audit_service_1.AuditService.createLog((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, // userId
    "DELETE_TIER", // actionType
    `Tier "${result.name}" deleted` // details
    );
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Tier deleted successfully",
        data: result,
    });
}));
const getTierByUserId = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    console.log("🔥 Requested userId:", userId);
    console.log("🌐 Incoming query params:", req.query);
    // Build query with provided userId
    const queryBuilder = new queryBuilder_1.default(tier_model_1.Tier.find(), Object.assign(Object.assign({}, req.query), { admin: userId }));
    queryBuilder
        .search(["name", "description"])
        .filter()
        .sort()
        .paginate()
        .fields();
    const tiers = yield queryBuilder.modelQuery;
    console.log("✅ Retrieved tiers:", tiers);
    const pagination = yield queryBuilder.getPaginationInfo();
    console.log("📊 Pagination info:", pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User tiers retrieved successfully",
        data: tiers,
        pagination,
    });
}));
exports.TierController = {
    createTier,
    updateTier,
    getTier,
    getSingleTier,
    deleteTier,
    getTierByUserId
};
