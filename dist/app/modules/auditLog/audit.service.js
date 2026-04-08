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
exports.AuditService = void 0;
const audit_model_1 = require("./audit.model");
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const user_model_1 = require("../user/user.model");
const mongoose_1 = require("mongoose");
const createLog = (userIdOrEmail, actionType, details) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let userId;
    let email = null;
    // ✅ যদি valid ObjectId হয়
    if (mongoose_1.Types.ObjectId.isValid(userIdOrEmail)) {
        const user = yield user_model_1.User.findById(userIdOrEmail).select("email");
        if (user) {
            userId = user._id;
            email = (_a = user === null || user === void 0 ? void 0 : user.email) !== null && _a !== void 0 ? _a : null;
        }
    }
    else {
        // ✅ email হলে
        email = userIdOrEmail;
    }
    const log = yield audit_model_1.AuditLog.create({
        actionType,
        details,
        user: userId,
        email,
    });
    return log;
});
const getAllLogsExceptMerchant = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const merchants = yield user_model_1.User.find({ role: "merchant" }, { _id: 1 });
    const merchantIds = merchants.map(m => m._id.toString());
    const auditQuery = new queryBuilder_1.default(audit_model_1.AuditLog.find({
        user: { $exists: false } // ✅ only admin logs
    }), query)
        .search(["actionType", "details"])
        .filter()
        .sort()
        .paginate();
    const result = yield auditQuery.modelQuery;
    const pagination = yield auditQuery.getPaginationInfo();
    return {
        meta: pagination,
        data: result,
    };
});
const getAllLogsExceptMerchantTier = (query) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[getAllLogsExceptMerchantTier] Incoming query:", query);
    const allowedRoles = ["VIEW_ADMIN", "ADMIN_SELL", "ADMIN_REP", "SUPER_ADMIN", "ADMIN"];
    const users = yield user_model_1.User.find({ role: { $in: allowedRoles } }, { _id: 1 });
    const userIds = users.map(u => u._id); // <-- ObjectId হিসেবে রাখা
    console.log("[getAllLogsExceptMerchantTier] Allowed user IDs:", userIds);
    const auditQuery = new queryBuilder_1.default(audit_model_1.AuditLog.find({
        user: { $in: userIds },
        actionType: { $in: ["CREATE_TIER", "UPDATE_TIER", "DELETE_TIER"] },
    }), query)
        .search(["actionType", "details"])
        .filter()
        .sort()
        .paginate();
    console.log("[getAllLogsExceptMerchantTier] Query:", auditQuery.modelQuery.getQuery());
    const result = yield auditQuery.modelQuery;
    console.log("[getAllLogsExceptMerchantTier] Query result length:", result.length);
    const pagination = yield auditQuery.getPaginationInfo();
    console.log("[getAllLogsExceptMerchantTier] Pagination info:", pagination);
    return {
        meta: pagination,
        data: result,
    };
});
const getLogsByUserId = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ QueryBuilder দিয়ে search, filter, sort, paginate
    const auditQuery = new queryBuilder_1.default(audit_model_1.AuditLog.find({ user: userId }), // populate not needed
    query)
        .search(["actionType", "details"])
        .filter()
        .sort()
        .paginate()
        .fields();
    // 2️⃣ Data fetch
    const result = yield auditQuery.modelQuery;
    // 3️⃣ Pagination info
    const pagination = yield auditQuery.getPaginationInfo();
    // 4️⃣ Format response
    const formattedData = result.map((log) => ({
        _id: log._id,
        actionType: log.actionType,
        details: log.details,
        email: log.email, // ✅ mail এখানে directly আছে
        createdAt: log.createdAt,
        // createdAt: log.createdAt
    }));
    return {
        meta: pagination,
        data: formattedData
    };
});
exports.AuditService = {
    createLog,
    getAllLogsExceptMerchant,
    getAllLogsExceptMerchantTier,
    getLogsByUserId
};
