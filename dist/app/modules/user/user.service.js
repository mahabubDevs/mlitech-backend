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
const user_1 = require("../../../enums/user");
const user_model_1 = require("./user.model");
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const subscription_model_1 = require("../subscription/subscription.model");
const generateRefferalId_1 = require("../../../util/generateRefferalId");
// import { sendOtp } from "../../../config/m3sms";
const veevoTechOtp_1 = require("../../../config/veevoTechOtp");
const user_utils_1 = require("./user.utils");
const referral_model_1 = __importDefault(require("../referral/referral.model"));
const notificationsHelper_1 = require("../../../helpers/notificationsHelper");
const notification_model_1 = require("../notification/notification.model");
const createAdminToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // check admin is exist or not;
    const isExistAdmin = yield user_model_1.User.findOne({ email: payload.email });
    if (isExistAdmin) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.CONFLICT, "This Email already taken");
    }
    // create admin data
    const referenceId = yield (0, generateRefferalId_1.createUniqueReferralId)();
    const adminData = Object.assign(Object.assign({}, payload), { referenceId });
    // create admin to db
    const createAdmin = yield user_model_1.User.create(adminData);
    if (!createAdmin) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to create Admin");
    }
    else {
        yield user_model_1.User.findByIdAndUpdate({ _id: createAdmin === null || createAdmin === void 0 ? void 0 : createAdmin._id }, { verified: true }, { new: true });
    }
    return createAdmin;
});
const createUserToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Check if user exists
    const isExitByEmail = yield user_model_1.User.isExistUserByEmail(payload.email);
    const isExitByPhone = yield user_model_1.User.isExistUserByPhone(payload.phone);
    // ✅ If verified user exists → throw error (same as old logic)
    if ((isExitByEmail && isExitByEmail.verified) || (isExitByPhone && isExitByPhone.verified)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User Already Exist");
    }
    let user = null;
    // 2️⃣ Update existing user
    if (isExitByEmail || isExitByPhone) {
        const existingUser = isExitByEmail || isExitByPhone;
        user = yield user_model_1.User.findByIdAndUpdate(existingUser._id, payload, { new: true });
        if (!user) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to update existing user");
        }
    }
    else {
        // 3️⃣ Create new user
        const referenceId = yield (0, generateRefferalId_1.createUniqueReferralId)();
        const customUserId = yield (0, user_utils_1.generateCustomUserId)(payload.role);
        const userData = Object.assign(Object.assign(Object.assign({}, payload), { referenceId,
            customUserId, status: payload.role === user_1.USER_ROLES.MERCENT
                ? user_1.USER_STATUS.INACTIVE
                : user_1.USER_STATUS.ACTIVE }), (payload.role === user_1.USER_ROLES.MERCENT && {
            approveStatus: user_1.APPROVE_STATUS.PENDING,
        }));
        user = yield user_model_1.User.create(userData);
        if (!user) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to create user");
        }
    }
    // 4️⃣ Handle referral if exists
    if ((payload === null || payload === void 0 ? void 0 : payload.referredId) && !user.referredInfo) {
        const referrer = yield user_model_1.User.findOne({ referenceId: payload.referredId });
        if (!referrer) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Referred Id Invalid!");
        }
        const referredInfo = {
            referredId: payload.referredId,
            referredBy: `${referrer.firstName} ${referrer.lastName || ""}`,
            referredUserId: referrer._id, // ✅ ObjectId stored for referral logic
        };
        yield user_model_1.User.findByIdAndUpdate(user._id, { $set: { referredInfo } });
        yield referral_model_1.default.create({
            referrer: referrer._id,
            referredUser: user._id,
        });
    }
    // 5️⃣ Generate OTP
    const otp = (0, generateOTP_1.default)();
    // 6️⃣ Save OTP to DB
    yield user_model_1.User.findByIdAndUpdate(user._id, {
        $set: {
            "authentication.phoneOTP": {
                code: otp,
                expireAt: new Date(Date.now() + 3 * 60000), // 3 min
            },
        },
    });
    console.log("Generated OTP for user:", otp);
    // 7️⃣ Send OTP via VeevoTech API
    if (user.phone) {
        try {
            yield (0, veevoTechOtp_1.sendOtp)(user.phone, otp.toString());
            console.log(`OTP sent to phone: ${user.phone}`);
        }
        catch (error) {
            console.error("Failed to send OTP via VeevoTech:", error);
        }
    }
    else {
        console.warn("⚠️ No phone number found for user:", user._id);
    }
    // 8️⃣ Notify Super Admin
    const superAdmin = yield user_model_1.User.findOne({ role: user_1.USER_ROLES.SUPER_ADMIN }).select("_id");
    if (superAdmin) {
        (0, notificationsHelper_1.sendNotification)({
            userIds: [superAdmin._id.toString()],
            title: "A new user has registered/updated",
            body: `User ${user.firstName} has registered or updated with the role ${user.role}.`,
            type: notification_model_1.NotificationType.SYSTEM,
        });
    }
    return user;
});
const getUserProfileFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(_id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const subscriptions = yield subscription_model_1.Subscription.find({ user: _id }).populate({
        path: "package",
        select: "title price duration isFreeTrial",
    });
    const formattedSubscriptions = subscriptions.map((sub) => {
        var _a, _b, _c;
        return ({
            subscriptionId: sub._id,
            packageId: ((_a = sub.package) === null || _a === void 0 ? void 0 : _a._id) || null,
            packageTitle: ((_b = sub.package) === null || _b === void 0 ? void 0 : _b.title) || "Deleted Package",
            price: sub.price,
            duration: ((_c = sub.package) === null || _c === void 0 ? void 0 : _c.duration) || "N/A",
            startDate: sub.currentPeriodStart,
            endDate: sub.currentPeriodEnd,
            status: sub.status,
            trxId: sub.trxId,
            subscriptionStripeId: sub.subscriptionId,
        });
    });
    // 🔥 Check free plan usage
    const hasUsedFreePlan = subscriptions.some((sub) => { var _a; return ((_a = sub.package) === null || _a === void 0 ? void 0 : _a.isFreeTrial) === true; });
    return Object.assign(Object.assign({}, isExistUser.toObject()), { subscriptions: formattedSubscriptions, totalSubscriptions: subscriptions.length, hasUsedFreePlan });
});
const updateProfileToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(_id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // unlink old files
    if (payload.profile && isExistUser.profile) {
        (0, unlinkFile_1.default)(isExistUser.profile);
    }
    if (payload.photo && isExistUser.photo) {
        (0, unlinkFile_1.default)(isExistUser.photo);
    }
    try {
        const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id }, payload, {
            new: true,
            runValidators: true,
        });
        return updateDoc;
    }
    catch (error) {
        /* -----------------------------
           🔴 Handle Duplicate Key Error
        ------------------------------*/
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            const field = Object.keys(error.keyValue || {})[0];
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.CONFLICT, `This ${field} already exists`);
        }
        throw error;
    }
});
const getUserOnlineStatusFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    const now = new Date();
    const diffMinutes = (now.getTime() - user.lastActive.getTime()) / 1000 / 60;
    const isOnline = diffMinutes <= 5; // 5 মিনিটের মধ্যে active হলে online
    return {
        userId: user._id.toString(),
        name: user.firstName + " " + user.lastName,
        isOnline,
        lastActive: user.lastActive,
        lastActiveMinutesAgo: Math.floor(diffMinutes),
    };
});
exports.UserService = {
    createUserToDB,
    getUserProfileFromDB,
    updateProfileToDB,
    createAdminToDB,
    getUserOnlineStatusFromDB,
};
