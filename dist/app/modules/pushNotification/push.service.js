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
exports.PushService = void 0;
const push_model_1 = require("./push.model");
const user_model_1 = require("../user/user.model");
const firebase_1 = __importDefault(require("../../../config/firebase"));
const digitalCard_model_1 = require("../customer/digitalCard/digitalCard.model");
const notificationsHelper_1 = require("../../../helpers/notificationsHelper");
const notification_model_1 = require("../notification/notification.model");
const mercentSellManagement_model_1 = require("../mercent/mercentSellManagement/mercentSellManagement.model");
const merchantCustomer_model_1 = require("../mercent/merchantCustomer/merchantCustomer.model");
// Send push (existing)
const sendNotificationToAllUsers = (payload, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const { sendType, title, body, country, tier, subscriptionType, status, city } = payload;
    try {
        console.log("[Notification] Payload received:", payload);
        console.log("[Notification] Admin ID:", adminId);
        const users2 = yield user_model_1.User.find({}).select("firstName lastName").lean();
        console.log("[Notification] Total users in system:", users2.length);
        // users যারা fcmToken আছে
        const usersWithToken = yield user_model_1.User.find({
            fcmToken: { $exists: true, $nin: [null, ""] },
        })
            .select("fcmToken")
            .lean();
        console.log("[Notification] Total users with fcmToken:", usersWithToken.length);
        // 1️⃣ Fetch all users who have fcmToken
        const allUsersWithToken = yield user_model_1.User.find({
            fcmToken: { $exists: true, $ne: null },
        }).select("fcmToken _id role subscription status city country tier");
        console.log("[Notification] All users with fcmToken (before filter):", allUsersWithToken);
        // 2️⃣ Build filter
        const userFilter = { fcmToken: { $exists: true, $ne: null } };
        if (sendType === "MERCENT")
            userFilter.role = "MERCENT";
        else if (sendType === "USER")
            userFilter.role = "USER";
        if (city && (sendType === "MERCENT" || sendType === "USER")) {
            userFilter.city = { $regex: `^${city}$`, $options: "i" };
        }
        if (country)
            userFilter.country = { $regex: `^${country}$`, $options: "i" };
        if (tier)
            userFilter.tier = tier.toUpperCase();
        if (subscriptionType)
            userFilter.subscription = { $regex: `^${subscriptionType}$`, $options: "i" };
        if (status)
            userFilter.status = { $regex: `^${status}$`, $options: "i" };
        console.log("[Notification] Final user filter:", userFilter);
        // 3️⃣ Fetch users after filter
        const filteredUsers = yield user_model_1.User.find(userFilter).select("fcmToken _id");
        console.log("[Notification] Users after applying filter:", filteredUsers);
        const tokens = [];
        const userIds = [];
        filteredUsers.forEach((u) => {
            if (u.fcmToken) {
                tokens.push(u.fcmToken);
                userIds.push(u._id);
            }
        });
        console.log("[Notification] Tokens to send:", tokens);
        if (tokens.length === 0) {
            return {
                sentCount: 0,
                failedCount: 0,
                message: "No users matched the criteria",
            };
        }
        // 4️⃣ Send push via Firebase
        const message = { notification: { title, body }, tokens };
        const response = yield firebase_1.default.messaging().sendEachForMulticast(message);
        // 5️⃣ Save notification in DB
        yield (0, notificationsHelper_1.sendNotification)({
            userIds,
            title,
            body,
            type: notification_model_1.NotificationType.SYSTEM,
            metadata: { sentBy: adminId },
            channel: { socket: true, push: true },
        });
        console.log("[Notification] Notification records created");
        // 6️⃣ Log successful and failed tokens
        const successfulTokens = [];
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
            var _a, _b;
            if (resp.success) {
                successfulTokens.push(tokens[idx]);
            }
            else {
                failedTokens.push(tokens[idx]);
                // 🔥 IMPORTANT DEBUG (এখানেই add করবা)
                console.log("❌ Failed Token:", tokens[idx]);
                console.log("🔥 Error Code:", (_a = resp.error) === null || _a === void 0 ? void 0 : _a.code);
                console.log("🔥 Error Message:", (_b = resp.error) === null || _b === void 0 ? void 0 : _b.message);
            }
        });
        console.log("[Notification] Successfully sent tokens:", successfulTokens);
        console.log("[Notification] Failed tokens:", failedTokens);
        // ❌ DELETE PART REMOVED
        return {
            sentCount: response.successCount,
            failedCount: response.failureCount,
            successfulTokens,
            failedTokens,
        };
    }
    catch (error) {
        console.error("[Notification] Error sending push:", error);
        throw new Error("Failed to send push notification");
    }
});
const sendMerchantPromotion = (payload, merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, message, image, target, filters, state, country, city, tier, subscriptionType } = payload;
    console.log("=================================================");
    console.log("🚀 sendMerchantPromotion START");
    console.log("🧾 Merchant ID:", merchantId);
    console.log("📄 Payload:", payload);
    console.log("=================================================");
    let users = [];
    const allCustomer = (filters === null || filters === void 0 ? void 0 : filters.segment) === "all_customer";
    if (allCustomer) {
        const cards = yield digitalCard_model_1.DigitalCard.find({ merchantId })
            .populate("userId", "fcmToken location createdAt isVIP")
            .select("userId availablePoints")
            .lean();
        console.log("📌 Total Cards found:", cards.length);
        const userIds = cards.map((c) => { var _a; return (_a = c.userId) === null || _a === void 0 ? void 0 : _a._id; }).filter(Boolean);
        const sells = yield mercentSellManagement_model_1.Sell.find({
            merchantId,
            userId: { $in: userIds },
            status: "completed",
        }).lean();
        console.log("📌 Total Completed Sells found:", sells.length);
        const sellMap = {};
        sells.forEach((sell) => {
            const uid = sell.userId.toString();
            if (!sellMap[uid])
                sellMap[uid] = [];
            sellMap[uid].push(sell);
        });
        const now = new Date();
        const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        const avgSpend = 1000;
        users = cards
            .map((c) => {
            var _a;
            const user = c.userId;
            if (!user)
                return null;
            const userId = user._id.toString();
            const userSells = sellMap[userId] || [];
            const totalSpend = userSells.reduce((sum, s) => sum + (s.discountedBill || 0), 0);
            const last6MonthsPurchases = userSells.filter((s) => new Date(s.createdAt) >= last6Months).length;
            let segment = "new_customer";
            if (last6MonthsPurchases >= 20 || totalSpend >= 3 * avgSpend)
                segment = "vip_customer";
            else if (last6MonthsPurchases >= 5 || totalSpend >= 1.5 * avgSpend)
                segment = "loyal_customer";
            else if (userSells.length >= 2 && last6MonthsPurchases < 5)
                segment = "returning_customer";
            return {
                userId: user._id,
                fcmToken: user.fcmToken,
                location: user.location,
                availablePoints: (_a = c.availablePoints) !== null && _a !== void 0 ? _a : 0,
                segment,
            };
        })
            .filter(Boolean);
        console.log("📌 Users after mapping segments:", users.length);
    }
    else {
        const merchantCustomers = yield merchantCustomer_model_1.MerchantCustomer.find({
            merchantId,
            segment: filters.segment,
        })
            .populate("customerId", "fcmToken location createdAt isVIP")
            .select("customerId points segment")
            .lean();
        console.log("📌 MerchantCustomers found:", merchantCustomers.length);
        users = merchantCustomers
            .map((mc) => {
            var _a;
            if (!mc.customerId)
                return null;
            return {
                userId: mc.customerId._id,
                fcmToken: mc.customerId.fcmToken,
                location: mc.customerId.location,
                availablePoints: (_a = mc.points) !== null && _a !== void 0 ? _a : 0,
                segment: mc.segment,
            };
        })
            .filter(Boolean);
        console.log("📌 Users mapped from MerchantCustomer:", users.length);
    }
    // ================= FILTER =================
    let skippedNoToken = 0;
    let skippedPoints = 0;
    let skippedRadius = 0;
    let eligibleUsers = 0;
    const merchantLocation = filters === null || filters === void 0 ? void 0 : filters.merchantLocation;
    const eligibleUsersData = users
        .filter((u) => {
        var _a;
        if (!u.fcmToken) {
            skippedNoToken++;
            return false;
        }
        if ((target === null || target === void 0 ? void 0 : target.type) === "points" && (filters === null || filters === void 0 ? void 0 : filters.minPoints) !== undefined && u.availablePoints < filters.minPoints) {
            skippedPoints++;
            return false;
        }
        if (typeof (filters === null || filters === void 0 ? void 0 : filters.radius) === "number" && filters.radius !== Infinity && (merchantLocation === null || merchantLocation === void 0 ? void 0 : merchantLocation.coordinates) && ((_a = u.location) === null || _a === void 0 ? void 0 : _a.coordinates)) {
            const [userLng, userLat] = u.location.coordinates;
            const [centerLng, centerLat] = merchantLocation.coordinates;
            const distance = getDistanceFromLatLonInKm(Number(userLat), Number(userLng), Number(centerLat), Number(centerLng));
            if (distance > filters.radius) {
                skippedRadius++;
                return false;
            }
        }
        eligibleUsers++;
        return true;
    })
        .map((u) => ({
        userId: u.userId,
        token: u.fcmToken,
    }));
    console.log("📊 Filter Stats -> No Token:", skippedNoToken, ", Points Skipped:", skippedPoints, ", Radius Skipped:", skippedRadius, ", Eligible:", eligibleUsers);
    const tokens = eligibleUsersData.map((u) => u.token);
    const finalUserIds = eligibleUsersData.map((u) => u.userId);
    if (tokens.length === 0) {
        console.log("⚠️ No eligible users to send push notification");
        return { sentCount: 0, failedCount: 0, message: "No customers matched" };
    }
    // ================= FIREBASE =================
    console.log("📩 Sending Firebase notification to tokens:", tokens.length);
    const firebaseMessage = {
        notification: {
            title,
            body: message,
            image,
        },
        data: {
            type: "promotion",
            merchantId: merchantId.toString(),
        },
        tokens,
    };
    const response = yield firebase_1.default.messaging().sendEachForMulticast(firebaseMessage);
    console.log("📩 Firebase Response:", response);
    // ================= SOCKET NOTIFICATION =================
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: finalUserIds,
        title,
        body: message,
        type: notification_model_1.NotificationType.PROMOTION,
        metadata: { merchantId },
        attachments: image ? [image] : [],
        channel: { socket: true, push: false },
    });
    console.log("🔔 Socket notifications sent");
    // ================= DB STORE =================
    const pushDoc = yield push_model_1.Push.create({
        title,
        body: message,
        state,
        country,
        city,
        tier,
        subscriptionType,
        status: "sent",
        createdBy: merchantId,
        sentCount: response.successCount,
        failedCount: response.failureCount,
        mediaUrl: image,
    });
    console.log("💾 Push record saved in DB:", pushDoc._id);
    return {
        sentCount: response.successCount,
        failedCount: response.failureCount,
        dbRecord: pushDoc,
    };
});
// Helper functions
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
// Get all push notifications (Admin)
// const getAllPushesFromDB = async (query: any) => {
//   let baseQuery = Push.find({});
//   const qb = new QueryBuilder(baseQuery, query);
//   qb.search(["title", "body", "state"]).filter().sort().paginate().fields();
//   const data = await qb.modelQuery.lean();
//   const pagination = await qb.getPaginationInfo();
//   return { data, pagination };
// };
exports.PushService = {
    sendNotificationToAllUsers,
    sendMerchantPromotion
    // getAllPushesFromDB,
};
