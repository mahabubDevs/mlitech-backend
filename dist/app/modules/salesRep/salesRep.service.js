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
exports.SalesRepService = void 0;
const salesRep_model_1 = require("./salesRep.model");
const user_model_1 = require("../user/user.model");
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const user_1 = require("../../../enums/user");
const generateCashToken_1 = require("../../../util/generateCashToken");
const mongoose_1 = require("mongoose");
const subscription_model_1 = require("../subscription/subscription.model");
const package_model_1 = require("../package/package.model");
const notificationsHelper_1 = require("../../../helpers/notificationsHelper");
const notification_model_1 = require("../notification/notification.model");
const referral_model_1 = __importDefault(require("../referral/referral.model"));
const pointTransaction_model_1 = __importDefault(require("../pointTransaction/pointTransaction.model"));
const sendPushNotification_1 = require("../../../helpers/sendPushNotification");
const createSalesRepData = (user, packageId) => __awaiter(void 0, void 0, void 0, function* () {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    // 🔍 Check if SalesRep exists in last 7 days
    const existingSalesRep = yield salesRep_model_1.SalesRep.findOne({
        customerId: user._id,
        createdAt: { $gte: sevenDaysAgo },
    });
    if (existingSalesRep) {
        return null;
    }
    const price = yield package_model_1.Package.findById(packageId).select("price");
    yield salesRep_model_1.SalesRep.create({
        customerId: user._id,
        packageId,
        price: price === null || price === void 0 ? void 0 : price.price,
    });
    const admins = yield user_model_1.User.find({ role: { $in: [user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN] } }).select("_id");
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: admins.map((admin) => admin._id),
        title: "New customer added in sales rep",
        body: "A customer requested to make payment by sales rep.",
        type: notification_model_1.NotificationType.SYSTEM,
    });
    yield user_model_1.User.findByIdAndUpdate(user._id, { isUserWaiting: true }, {
        upsert: true
    });
});
const getSalesRepData = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = salesRep_model_1.SalesRep.find().populate("customerId", "customUserId firstName lastName email phone  paymentStatus subscription");
    const salesRepQuery = new queryBuilder_1.default(baseQuery, query)
        .paginate()
        .filter()
        .sort()
        .search(["firstName", "lastName", "email"]);
    const [salesRep, pagination] = yield Promise.all([
        salesRepQuery.modelQuery.lean(),
        salesRepQuery.getPaginationInfo(),
    ]);
    return {
        salesRep,
        pagination,
    };
});
const updateUserAcknowledgeStatus = (dataId, salesRepId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const salesRep = yield user_model_1.User.findById(salesRepId);
    if (!salesRep) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No sales rep found for the given user");
    }
    const result = yield salesRep_model_1.SalesRep.findByIdAndUpdate(dataId, {
        salesRepName: `${salesRep === null || salesRep === void 0 ? void 0 : salesRep.firstName} ${(_a = salesRep === null || salesRep === void 0 ? void 0 : salesRep.lastName) !== null && _a !== void 0 ? _a : ""}`.trim(),
        salesRepReferralId: salesRep.referenceId,
        acknowledged: true,
        acknowledgeDate: new Date(),
    }, { new: true, runValidators: true });
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No sales rep found for the given user");
    }
    // await sendNotification({
    //   userIds: [result.customerId],
    //   title: "Sales rep acknowledged",
    //   body: "Your sales rep has acknowledged your request.",
    //   type: NotificationType.SYSTEM,
    // })
});
const generateToken = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const salesRep = yield salesRep_model_1.SalesRep.findById(id);
    if (!salesRep) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Sales rep not found");
    }
    if (salesRep.token) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Token already generated");
    }
    // const user = await User.findById(salesRep.customerId).select("status");
    // if (!user) {
    //   throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    // }
    // if (user.status !== USER_STATUS.ACTIVE) {
    //   throw new ApiError(StatusCodes.FORBIDDEN, "User is not active");
    // }
    const token = (0, generateCashToken_1.generateCashToken)();
    const result = yield salesRep_model_1.SalesRep.findByIdAndUpdate(id, {
        token,
        tokenGenerateDate: new Date(),
        paymentStatus: "paid"
    }, { new: true, runValidators: true });
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No sales rep record found for this user");
    }
    return { token };
});
const validateToken = (userId, token) => __awaiter(void 0, void 0, void 0, function* () {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const result = yield salesRep_model_1.SalesRep.findOne({ customerId: userId, token, createdAt: { $gte: sevenDaysAgo } });
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid request");
    }
    if (result.paymentStatus === "paid") {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Already Validated");
    }
    if (result.token !== token) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Token");
    }
    const existingPackage = yield package_model_1.Package.findById(result.packageId);
    if (!existingPackage) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Package not found");
    }
    result.paymentStatus = "paid";
    result.price = existingPackage === null || existingPackage === void 0 ? void 0 : existingPackage.price;
    yield result.save();
    // this is for test purpose
    const subscriptionData = {
        user: new mongoose_1.Types.ObjectId(userId),
        package: new mongoose_1.Types.ObjectId(result.packageId),
        price: existingPackage === null || existingPackage === void 0 ? void 0 : existingPackage.price,
        customerId: userId,
        subscriptionId: new Date().toISOString(),
        remaining: 0,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 30);
            return d.toISOString();
        })(),
        trxId: "N/A",
        status: "active",
        source: "salesRep",
    };
    yield subscription_model_1.Subscription.create(Object.assign({}, subscriptionData));
    yield user_model_1.User.findByIdAndUpdate(userId, { subscription: user_1.SUBSCRIPTION_STATUS.ACTIVE }, { new: true });
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: [userId],
        title: "Welcome to the app",
        body: "You have successfully subscribed to our app. We are excited to have you on board!",
        type: notification_model_1.NotificationType.WELCOME
    });
    const referralResult = yield referral_model_1.default.findOne({
        referredUser: userId
    });
    if (referralResult && !referralResult.completed) {
        console.log("🚀 Processing referral for user: new", userId);
        const referredUser = yield user_model_1.User.findById(userId).select("firstName lastName");
        const referrerUser = yield user_model_1.User.findById(referralResult.referrer).select("firstName lastName");
        const referredUserName = `${(referredUser === null || referredUser === void 0 ? void 0 : referredUser.firstName) || ""} ${(referredUser === null || referredUser === void 0 ? void 0 : referredUser.lastName) || ""}`.trim();
        const referrerUserName = `${(referrerUser === null || referrerUser === void 0 ? void 0 : referrerUser.firstName) || ""} ${(referrerUser === null || referrerUser === void 0 ? void 0 : referrerUser.lastName) || ""}`.trim();
        // Create point transactions
        yield pointTransaction_model_1.default.create({
            user: userId,
            type: "EARN",
            source: "REFERRAL",
            referral: referralResult._id,
            points: 10,
            note: "Referral points",
        });
        yield pointTransaction_model_1.default.create({
            user: referralResult.referrer,
            type: "EARN",
            source: "REFERRAL",
            referral: referralResult._id,
            points: 10,
            note: "Referral points",
        });
        // Update points
        yield user_model_1.User.findByIdAndUpdate(referralResult.referrer, { $inc: { points: 10 } }, { new: true });
        yield user_model_1.User.findByIdAndUpdate(userId, { $inc: { points: 10 } }, { new: true });
        // Send notifications with names
        yield (0, notificationsHelper_1.sendNotification)({
            userIds: [referralResult.referrer.toString()],
            title: "Referral points",
            body: `You have earned 10 points for referring ${referredUserName}`,
            type: notification_model_1.NotificationType.REFERRAL,
        });
        yield (0, notificationsHelper_1.sendNotification)({
            userIds: [userId.toString()],
            title: "Referral points",
            body: `You have earned 10 points for being referred by ${referrerUserName}`,
            type: notification_model_1.NotificationType.REFERRAL,
        });
        referralResult.completed = true;
        yield referralResult.save();
    }
});
const getDurationInDays = (duration) => {
    switch (duration) {
        case '1 month':
            return 30;
        case '4 months':
            return 120;
        case '8 months':
            return 240;
        case '1 year':
            return 365;
        default:
            return 30; // fallback
    }
};
const activateAccount = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ SalesRep খুঁজে আনা
    const salesRep = yield salesRep_model_1.SalesRep.findById(id);
    if (!salesRep)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Sales rep not found");
    // 2️⃣ Package খুঁজে আনা
    const packageData = yield package_model_1.Package.findById(salesRep.packageId).select("price durationInDays");
    if (!packageData)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Package not found");
    // 3️⃣ Subscription Data তৈরি করা
    const subscriptionData = {
        user: new mongoose_1.Types.ObjectId(salesRep.customerId),
        package: new mongoose_1.Types.ObjectId(salesRep.packageId),
        price: packageData.price,
        customerId: salesRep.customerId.toString(),
        subscriptionId: "SALESREP_" + new Date().toISOString(),
        remaining: 0,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: (() => {
            const d = new Date();
            const duration = getDurationInDays(packageData.duration) || 30; // package অনুযায়ী দিন
            d.setDate(d.getDate() + duration);
            return d.toISOString();
        })(),
        trxId: "N/A",
        status: "active",
        source: "salesRep",
    };
    // 4️⃣ Subscription সেভ করা
    const subscription = yield subscription_model_1.Subscription.create(subscriptionData);
    // 5️⃣ User এর subscription status আপডেট
    const user = yield user_model_1.User.findByIdAndUpdate(salesRep.customerId, {
        subscription: user_1.SUBSCRIPTION_STATUS.ACTIVE,
        isUserWaiting: false,
    }, { new: true, upsert: true, select: "fcmToken firstName lastName points referredInfo" });
    // 6️⃣ SalesRep এর subscription status আপডেট
    yield salesRep_model_1.SalesRep.findByIdAndUpdate(id, { subscriptionStatus: user_1.SUBSCRIPTION_STATUS.ACTIVE, subscriptionStatusChangedDate: new Date() }, { new: true, upsert: true });
    // 7️⃣ Welcome Notifications পাঠানো
    if (user === null || user === void 0 ? void 0 : user.fcmToken) {
        yield (0, sendPushNotification_1.sendPushNotification)(user.fcmToken, "Welcome to the app", "You have successfully subscribed to our app. We are excited to have you on board!");
    }
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: [salesRep.customerId.toString()],
        title: "Welcome to the app",
        body: "You have successfully subscribed to our app. We are excited to have you on board!",
        type: notification_model_1.NotificationType.WELCOME,
    });
    // 8️⃣ Real-time Event Emit করা
    io.emit(`salesActivation::${salesRep.customerId.toString()}`, { status: "active" });
    // 9️⃣ Referral Bonus Logic (20%)
    const referralResult = yield referral_model_1.default.findOne({
        referredUser: salesRep.customerId,
        completed: false,
    });
    if (referralResult) {
        const referrerId = referralResult.referrer;
        console.log("🚀 Processing referral for salesRep user:", salesRep.customerId);
        const subscriptionPrice = subscriptionData.price || 0;
        const referralPoints = Math.round(subscriptionPrice * 0.2);
        if (referralPoints > 0) {
            // Referrer এর points যোগ করা
            yield user_model_1.User.findByIdAndUpdate(referrerId, {
                $inc: { points: referralPoints },
                $push: { referralBonusGivenFor: salesRep.customerId },
            });
            // Point Transaction তৈরি
            yield pointTransaction_model_1.default.create({
                user: referrerId,
                type: "EARN",
                source: "REFERRAL",
                referral: referralResult._id,
                points: referralPoints,
                note: `Earned ${referralPoints} points from referral subscription (${salesRep.customerId})`,
            });
            // Referral Notification পাঠানো
            const referredUser = yield user_model_1.User.findById(salesRep.customerId).select("firstName lastName");
            const referrerUser = yield user_model_1.User.findById(referrerId).select("firstName lastName");
            const referredUserName = `${(referredUser === null || referredUser === void 0 ? void 0 : referredUser.firstName) || ""} ${(referredUser === null || referredUser === void 0 ? void 0 : referredUser.lastName) || ""}`.trim();
            const referrerUserName = `${(referrerUser === null || referrerUser === void 0 ? void 0 : referrerUser.firstName) || ""} ${(referrerUser === null || referrerUser === void 0 ? void 0 : referrerUser.lastName) || ""}`.trim();
            yield (0, notificationsHelper_1.sendNotification)({
                userIds: [referrerId.toString()],
                title: "Referral Bonus Earned",
                body: `${referredUserName} has joined using your referral code. You earned ${referralPoints} points!`,
                type: notification_model_1.NotificationType.REFERRAL,
            });
            yield (0, notificationsHelper_1.sendNotification)({
                userIds: [salesRep.customerId.toString()],
                title: "Referral Applied",
                body: `You have joined using referral code of ${referrerUserName}.`,
                type: notification_model_1.NotificationType.REFERRAL,
            });
            referralResult.completed = true;
            yield referralResult.save();
        }
    }
    return subscription;
});
const deactivateAccount = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const salesRep = yield salesRep_model_1.SalesRep.findByIdAndUpdate(id, {
        subscriptionStatus: user_1.SUBSCRIPTION_STATUS.INACTIVE,
        subscriptionStatusChangedDate: new Date(),
    }, { new: true, upsert: true });
    if (!salesRep) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Sales rep not found");
    }
    const user = yield user_model_1.User.findById(salesRep.customerId);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    user.subscription = user_1.SUBSCRIPTION_STATUS.INACTIVE;
    yield user.save();
});
exports.SalesRepService = {
    createSalesRepData,
    getSalesRepData,
    updateUserAcknowledgeStatus,
    generateToken,
    validateToken,
    activateAccount,
    deactivateAccount
};
