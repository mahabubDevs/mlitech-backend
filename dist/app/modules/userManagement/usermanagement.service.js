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
exports.UserService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const user_1 = require("../../../enums/user");
const user_model_1 = require("../user/user.model");
const user_utils_1 = require("../user/user.utils");
const generateRefferalId_1 = require("../../../util/generateRefferalId");
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
// create user
const createUserToDB = (payload, creator) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.email)
        throw new ApiErrors_1.default(400, "Email is required");
    if (!payload.phone)
        throw new ApiErrors_1.default(400, "Phone number is required");
    if (!payload.password)
        throw new ApiErrors_1.default(400, "Password is required");
    // ✅ Email / phone check
    const isEmailExist = yield user_model_1.User.isExistUserByEmail(payload.email);
    if (isEmailExist)
        throw new ApiErrors_1.default(400, "Email already exists");
    const isPhoneExist = yield user_model_1.User.isExistUserByPhone(payload.phone);
    if (isPhoneExist)
        throw new ApiErrors_1.default(400, "Phone already exists");
    const ALLOWED_CREATOR_ROLES = [
        user_1.USER_ROLES.ADMIN_SELL,
        user_1.USER_ROLES.VIEW_ADMIN,
        user_1.USER_ROLES.ADMIN,
        user_1.USER_ROLES.ADMIN_REP
    ];
    let role = user_1.USER_ROLES.VIEW_ADMIN;
    if (payload.role) {
        if (!ALLOWED_CREATOR_ROLES.includes(payload.role)) {
            throw new ApiErrors_1.default(400, "User can only be created with allowed roles");
        }
        role = payload.role;
    }
    const referenceId = yield (0, generateRefferalId_1.createUniqueReferralId)();
    const customUserId = yield (0, user_utils_1.generateCustomUserId)(role);
    const userData = Object.assign(Object.assign({}, payload), { role,
        // merchantId: creator?.role?.startsWith("MERCHANT") ? creator._id : null, // ✅ ObjectId pass
        customUserId,
        referenceId, verified: true });
    const result = yield user_model_1.User.create(userData);
    return result;
});
var APPROVE_STATUS;
(function (APPROVE_STATUS) {
    APPROVE_STATUS["APPROVED"] = "approved";
    APPROVE_STATUS["PENDING"] = "pending";
})(APPROVE_STATUS || (APPROVE_STATUS = {}));
const createMerchantToDB = (payload, creatorUser) => __awaiter(void 0, void 0, void 0, function* () {
    // required check
    if (!payload.email) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email is required");
    }
    if (!payload.phone) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Phone is required");
    }
    if (!payload.password) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password is required");
    }
    // uniqueness check
    if (yield user_model_1.User.isExistUserByEmail(payload.email)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email already exists");
    }
    if (yield user_model_1.User.isExistUserByPhone(payload.phone)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Phone already exists");
    }
    const referenceId = yield (0, generateRefferalId_1.createUniqueReferralId)();
    const customerId = yield (0, user_utils_1.generateCustomUserId)(user_1.USER_ROLES.MERCENT);
    const merchantData = Object.assign(Object.assign({}, payload), { 
        // system fields
        role: user_1.USER_ROLES.MERCENT, status: user_1.USER_STATUS.ACTIVE, verified: true, customUserId: customerId, referenceId, 
        // merchant specific
        businessName: payload.businessName, subscription: payload.subscriptionType, lastPaymentDate: payload.lastPaymentDate, expiryDate: payload.expiryDate, tier: payload.tier, salesRep: payload.salesRep, city: payload.city });
    // ✅ ONLY super_admin auto approve
    if (creatorUser.role === user_1.USER_ROLES.SUPER_ADMIN) {
        merchantData.approveStatus = APPROVE_STATUS.APPROVED;
    }
    // 🔍 Check duplicate email or phone
    if (payload.email || payload.phone) {
        const existingUser = yield user_model_1.User.findOne({
            $or: [
                { email: payload.email },
                { phone: payload.phone }
            ]
        });
        if (existingUser) {
            if (existingUser.email === payload.email) {
                throw new ApiErrors_1.default(400, "Email already exists");
            }
            if (existingUser.phone === payload.phone) {
                throw new ApiErrors_1.default(400, "Phone number already exists");
            }
        }
    }
    const result = yield user_model_1.User.create(merchantData);
    return result;
});
// get all users
// Service
const getAllUsersFromDB = (requestingUserRole, query) => __awaiter(void 0, void 0, void 0, function* () {
    const allowedRoles = ["ADMIN", "ADMIN_SELL", "ADMIN_REP", "SUPER_ADMIN", "MANAGER", "VIEW_ADMIN"];
    if (!allowedRoles.includes(requestingUserRole)) {
        throw new ApiErrors_1.default(403, "Access denied");
    }
    // Base query
    let baseQuery = user_model_1.User.find({ role: { $in: allowedRoles } });
    // QueryBuilder instance
    const qb = new queryBuilder_1.default(baseQuery, query)
        .search(["firstName", "lastName", "email", "phone"]) // search
        .filter() // filter
        .sort() // sort
        .paginate() // pagination
        .fields(); // fields select
    // Execute query
    const users = yield qb.modelQuery.lean();
    // Pagination info
    const pagination = yield qb.getPaginationInfo();
    return { users, pagination };
});
// get single user
const getSingleUserFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findById(id).select("-password");
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return result;
});
// update user
const updateUserToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield user_model_1.User.findById(id);
    if (!isExist) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // password কখনো update হবে না
    if (payload.password) {
        delete payload.password;
    }
    const result = yield user_model_1.User.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    }).select("-password");
    return result;
});
// delete user
const deleteUserFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield user_model_1.User.findById(id);
    if (!isExist) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    yield user_model_1.User.findByIdAndDelete(id);
    return { deleted: true };
});
// toggle active/inactive
const toggleUserStatusFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // Ensure subscription enum is valid
    if (!user.subscription || !Object.values(user_1.SUBSCRIPTION_STATUS).includes(user.subscription)) {
        user.subscription = user_1.SUBSCRIPTION_STATUS.INACTIVE;
    }
    user.status =
        user.status === user_1.USER_STATUS.ACTIVE
            ? user_1.USER_STATUS.INACTIVE
            : user_1.USER_STATUS.ACTIVE;
    yield user.save();
    return user;
});
const getAllMerchants = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = user_model_1.User.find({ role: user_1.USER_ROLES.MERCENT });
    const allMerchantsQuery = new queryBuilder_1.default(baseQuery, query)
        .search(["firstName", "lastName", "email", "phone"])
        .filter()
        .paginate()
        .sort();
    const allmerchants = yield allMerchantsQuery.modelQuery.lean();
    const pagination = yield allMerchantsQuery.getPaginationInfo();
    return {
        allmerchants,
        pagination,
    };
});
const getSingleMerchant = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield user_model_1.User.findOne({
        _id: id,
        role: user_1.USER_ROLES.MERCENT,
    }).lean();
    if (!merchant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    return merchant;
});
const updateMerchant = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield user_model_1.User.findOneAndUpdate({ _id: id, role: user_1.USER_ROLES.MERCENT }, payload, { new: true }).lean();
    if (!merchant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    return merchant;
});
const deleteMerchant = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield user_model_1.User.findOneAndDelete({
        _id: id,
        role: user_1.USER_ROLES.MERCENT,
    });
    if (!merchant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    return true;
});
const toggleMerchantStatus = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield user_model_1.User.findOne({
        _id: id,
        role: user_1.USER_ROLES.MERCENT,
    });
    if (!merchant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    merchant.status =
        merchant.status === user_1.USER_STATUS.ACTIVE
            ? user_1.USER_STATUS.INACTIVE
            : user_1.USER_STATUS.ACTIVE;
    yield merchant.save();
    return {
        id: merchant._id,
        status: merchant.status,
    };
});
exports.UserService = {
    createUserToDB,
    createMerchantToDB,
    getAllUsersFromDB,
    getSingleUserFromDB,
    updateUserToDB,
    deleteUserFromDB,
    toggleUserStatusFromDB,
    getSingleMerchant,
    updateMerchant,
    deleteMerchant,
    toggleMerchantStatus,
    getAllMerchants
};
