"use strict";
// আগের function
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
const user_1 = require("../../../enums/user");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const user_model_1 = require("../user/user.model");
const user_utils_1 = require("../user/user.utils");
const ALLOWED_MERCHANT_ROLES = [
    user_1.USER_ROLES.ADMIN_MERCENT,
    user_1.USER_ROLES.VIEW_MERCENT,
];
const createUserToDB = (payload, loggedInUser) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🚀 createUserToDB called with payload:", payload);
    console.log("👤 Logged-in user:", loggedInUser);
    // 🔐 Only Merchant or Admin Merchant can create users
    if (loggedInUser.role !== user_1.USER_ROLES.MERCENT && loggedInUser.role !== user_1.USER_ROLES.ADMIN_MERCENT) {
        throw new ApiErrors_1.default(403, "Only merchant or admin merchant can create users");
    }
    // 🔒 Ownership (main merchant set করা)
    if (loggedInUser.role === user_1.USER_ROLES.MERCENT) {
        // মূল Merchant
        payload.merchantId = loggedInUser._id;
    }
    else if (loggedInUser.role === user_1.USER_ROLES.ADMIN_MERCENT) {
        // Admin Merchant হলে, মূল Merchant কে assign
        payload.merchantId = loggedInUser.merchantId;
    }
    payload.createdBy = loggedInUser._id;
    payload.isSubMerchant = true;
    console.log("🔑 Ownership fields set:", {
        createdBy: payload.createdBy,
        merchantId: payload.merchantId,
        isSubMerchant: payload.isSubMerchant,
    });
    // 🔒 Role validation
    if (payload.role) {
        if (!ALLOWED_MERCHANT_ROLES.includes(payload.role)) {
            console.log("❌ Invalid role provided:", payload.role);
            throw new ApiErrors_1.default(400, "Merchant can only create ADMIN_MERCENT or VIEW_MERCENT users");
        }
    }
    else {
        payload.role = user_1.USER_ROLES.VIEW_MERCENT;
    }
    console.log("🛡 Role set:", payload.role);
    // 🔒 Default values
    payload.status = user_1.USER_STATUS.ACTIVE;
    payload.verified = true;
    payload.isRootMerchant = false;
    console.log("⚙ Default values set:", {
        status: payload.status,
        verified: payload.verified,
        isRootMerchant: payload.isRootMerchant,
    });
    // ✅ Generate customUserId
    payload.customUserId = yield (0, user_utils_1.generateCustomUserId)(user_1.USER_ROLES.MERCENT);
    console.log("🆔 Generated customUserId:", payload.customUserId);
    // ✅ Generate referenceId
    if (!payload.referenceId) {
        payload.referenceId = `REF-${Math.floor(10000 + Math.random() * 90000)}`;
    }
    console.log("🔖 Reference ID:", payload.referenceId);
    // 📝 Fetch merchant info from DB and auto-populate fields
    const merchantFromDB = yield user_model_1.User.findById(payload.merchantId).lean();
    if (!merchantFromDB) {
        throw new ApiErrors_1.default(404, "Merchant not found in database");
    }
    const infoFields = [
        "address",
        "businessName",
        "city",
        "country",
        "service",
        "about",
        "website",
        "photo",
        "profile",
    ];
    infoFields.forEach((field) => {
        if (merchantFromDB[field] !== undefined) {
            payload[field] = merchantFromDB[field];
        }
    });
    console.log("🏢 Info fields populated from merchant DB:", infoFields.reduce((acc, f) => {
        acc[f] = payload[f];
        return acc;
    }, {}));
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
    const user = yield user_model_1.User.create(payload);
    console.log("✅ User created:", user);
    return user.toObject();
});
// ---------------- Get Users By Merchant ----------------
const getUsersByMerchant = (loggedInUser, query) => __awaiter(void 0, void 0, void 0, function* () {
    const mainMerchantId = loggedInUser.role === user_1.USER_ROLES.MERCENT
        ? loggedInUser._id
        : loggedInUser.merchantId; // যদি admin হয়, তার main merchant
    if (!mainMerchantId) {
        throw new ApiErrors_1.default(400, "Invalid logged in user");
    }
    // এখন query: merchantId = mainMerchantId
    const queryBuilder = new queryBuilder_1.default(user_model_1.User.find({ merchantId: mainMerchantId }).lean(), query);
    queryBuilder
        .search(['firstName', 'email']) // name field বদলে firstName
        .filter()
        .sort()
        .fields()
        .paginate();
    const users = yield queryBuilder.modelQuery;
    const paginationInfo = yield queryBuilder.getPaginationInfo();
    return { users, paginationInfo };
});
// ---------------- Get Single User ----------------
const getSingleUser = (userId, loggedInUser) => __awaiter(void 0, void 0, void 0, function* () {
    const creatorId = loggedInUser.id || loggedInUser._id;
    if (!creatorId) {
        throw new ApiErrors_1.default(400, "Invalid logged in user");
    }
    // 🔥 Only fetch user created by this merchant
    const user = yield user_model_1.User.findOne({
        _id: userId,
        createdBy: creatorId,
    }).lean();
    if (!user) {
        throw new ApiErrors_1.default(404, "User not found or not authorized");
    }
    return user;
});
// ---------------- Update User ----------------
const updateUser = (userId, payload, loggedInUser) => __awaiter(void 0, void 0, void 0, function* () {
    const creatorId = loggedInUser.id || loggedInUser._id;
    if (!creatorId) {
        throw new ApiErrors_1.default(400, "Invalid logged in user");
    }
    // 🔒 Prevent changing ownership
    delete payload.createdBy;
    delete payload.merchantId;
    // 🔒 Role validation
    if (payload.role && !ALLOWED_MERCHANT_ROLES.includes(payload.role)) {
        throw new ApiErrors_1.default(400, "Merchant can only assign MERCENT or VIEW_MERCENT roles");
    }
    // 🔒 Find user created by this merchant
    const filter = { _id: userId, createdBy: creatorId };
    const updatedUser = yield user_model_1.User.findOneAndUpdate(filter, payload, { new: true }).lean();
    if (!updatedUser) {
        throw new ApiErrors_1.default(404, "User not found or not authorized");
    }
    return updatedUser;
});
// ---------------- Delete User ----------------
const deleteUser = (userId, loggedInUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("===== deleteUser START =====");
    console.log("Requested userId to delete:", userId);
    console.log("Logged in user:", loggedInUser);
    // 1️⃣ Initialize filter
    const filter = { _id: userId };
    // 2️⃣ MERCENT role হলে merchantId fetch
    let merchantId = null;
    if (loggedInUser.role === user_1.USER_ROLES.MERCENT) {
        const merchant = yield user_model_1.User.findById(loggedInUser._id).select("merchantId");
        merchantId = ((_a = merchant === null || merchant === void 0 ? void 0 : merchant.merchantId) === null || _a === void 0 ? void 0 : _a.toString()) || null;
        console.log("Fetched merchantId from DB:", merchantId);
        if (!merchantId) {
            console.warn("⚠️ MERCENT user has no merchantId, cannot delete other users safely");
        }
        else {
            filter.merchantId = merchantId;
            console.log("Applying merchantId filter:", merchantId);
        }
    }
    console.log("Final filter for deletion:", filter);
    // 3️⃣ Delete user
    const deleted = yield user_model_1.User.findOneAndDelete(filter);
    if (!deleted) {
        console.log("❌ No user found or not authorized to delete");
        throw new ApiErrors_1.default(404, "User not found or not authorized");
    }
    console.log("✅ User deleted successfully:", deleted._id);
    console.log("===== deleteUser END =====");
    return true;
});
// ---------------- Toggle Active/Inactive ----------------
const toggleUserStatus = (userId, loggedInUser) => __awaiter(void 0, void 0, void 0, function* () {
    const creatorId = loggedInUser.id || loggedInUser._id;
    if (!creatorId) {
        throw new ApiErrors_1.default(400, "Invalid logged in user");
    }
    // 🔒 Only toggle users created by this merchant
    const user = yield user_model_1.User.findOne({ _id: userId, createdBy: creatorId });
    if (!user) {
        throw new ApiErrors_1.default(404, "User not found or not authorized");
    }
    // 🔄 Toggle status
    user.status = user.status === user_1.USER_STATUS.ACTIVE
        ? user_1.USER_STATUS.INACTIVE
        : user_1.USER_STATUS.ACTIVE;
    yield user.save();
    return { id: user._id, status: user.status };
});
exports.UserService = {
    createUserToDB,
    getUsersByMerchant,
    getSingleUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
};
