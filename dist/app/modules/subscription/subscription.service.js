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
exports.SubscriptionService = void 0;
const package_model_1 = require("../package/package.model");
const subscription_model_1 = require("./subscription.model");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const user_model_1 = require("../user/user.model");
const mongoose_1 = require("mongoose");
const referral_model_1 = __importDefault(require("../referral/referral.model"));
const pointTransaction_model_1 = __importDefault(require("../pointTransaction/pointTransaction.model"));
const notificationsHelper_1 = require("../../../helpers/notificationsHelper");
const notification_model_1 = require("../notification/notification.model");
const dateHelper_1 = require("../../../helpers/dateHelper");
const user_1 = require("../../../enums/user");
// =========================
// createSubscriptionSession
// =========================
const calculateISODateString = (date) => {
    return date.toISOString(); // "2026-04-06T05:31:35.697Z" ফরম্যাটে
};
const createSubscriptionSession = (userId, packageId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("🚀 createSubscriptionSession called");
    console.log("UserId:", userId, "PackageId:", packageId);
    const pkg = yield package_model_1.Package.findById(packageId);
    if (!pkg)
        throw new Error("Package not found");
    console.log(`✅ Package found: ${pkg.title}, isFreeTrial: ${pkg.isFreeTrial}`);
    const user = yield user_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    console.log(`👤 User found: ${user.firstName}, Email: ${user.email}, Points: ${user.points}`);
    // Free trial
    if (pkg.isFreeTrial) {
        const hasUsedFreePlan = yield subscription_model_1.Subscription.exists({ user: userId, package: packageId });
        if (hasUsedFreePlan)
            throw new Error("You have already used the free plan");
        const subscription = yield subscription_model_1.Subscription.create({
            user: userId,
            package: packageId,
            price: 0,
            subscriptionId: "FREE_PLAN_" + Date.now(),
            currentPeriodStart: calculateISODateString(new Date()),
            currentPeriodEnd: calculateISODateString((0, dateHelper_1.calculateEndDate)(pkg.duration)),
            status: "active",
            source: "manual",
            remaining: 1,
            customerId: null,
        });
        console.log("💾 Saving free plan subscription to DB:", subscription);
        yield user_model_1.User.findByIdAndUpdate(userId, { subscription: user_1.SUBSCRIPTION_STATUS.ACTIVE, paymentStatus: "paid", });
        console.log("✅ Free plan subscription created:", subscription._id);
        return { sessionId: null, url: null, subscription };
    }
    // Paid plan
    console.log("💰 Paid plan detected");
    let userPoints = user.points || 0;
    let finalPrice = pkg.price;
    const maxDiscount = pkg.price * 0.8;
    const usablePoints = Math.min(userPoints, maxDiscount);
    if (usablePoints > 0) {
        finalPrice -= usablePoints;
        console.log(`💎 Final price after points: ${finalPrice}`);
    }
    // Stripe Price logic
    pkg.priceIdWithPoints = pkg.priceIdWithPoints || {};
    let stripePriceId;
    if (usablePoints > 0) {
        if (pkg.priceIdWithPoints[usablePoints]) {
            stripePriceId = pkg.priceIdWithPoints[usablePoints];
        }
        else {
            const stripePrice = yield stripe_1.default.prices.create({
                product: pkg.productId,
                unit_amount: Math.round(finalPrice * 100),
                currency: "usd",
                recurring: {
                    interval: ((_a = pkg.paymentType) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "monthly" ? "month" : "year",
                },
            });
            stripePriceId = stripePrice.id;
            pkg.priceIdWithPoints[usablePoints] = stripePriceId;
            yield package_model_1.Package.findByIdAndUpdate(pkg._id, { priceIdWithPoints: pkg.priceIdWithPoints });
        }
    }
    else {
        stripePriceId = pkg.priceId;
    }
    // ✅ Checkout session
    const session = yield stripe_1.default.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: user.email,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `https://miltech-business-dashboard-api.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://miltech-business-dashboard-api.vercel.app/failed`,
        client_reference_id: userId.toString(),
        metadata: {
            packageId: pkg._id.toString(),
            pointsUsed: usablePoints.toString(),
        },
    });
    console.log("✅ Stripe checkout session created:", session.id, session.url);
    return { sessionId: session.id, url: session.url };
});
// Called from webhook to save subscription after payment success
const activateSubscriptionInDB = (userId, packageId, stripeSubscription) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    console.log("==================================================");
    console.log("🚀 Activating subscription in DB");
    console.log({
        userId,
        packageId,
        stripeSubscriptionId: stripeSubscription === null || stripeSubscription === void 0 ? void 0 : stripeSubscription.id
    });
    console.log("==================================================");
    // 🔍 Prevent duplicate subscription
    const existingSub = yield subscription_model_1.Subscription.findOne({
        subscriptionId: stripeSubscription.id
    });
    console.log("🔎 Existing Subscription Found:", !!existingSub);
    if (existingSub) {
        console.log("⚠️ Subscription already exists in DB:", existingSub._id);
        yield user_model_1.User.findByIdAndUpdate(userId, {
            subscription: "active",
            paymentStatus: "paid"
        });
        console.log("✅ User subscription status updated to active (duplicate case)");
        return existingSub;
    }
    // 📦 Prepare subscription data
    const subscriptionData = {
        user: new mongoose_1.Types.ObjectId(userId),
        package: new mongoose_1.Types.ObjectId(packageId),
        price: ((_a = stripeSubscription.plan) === null || _a === void 0 ? void 0 : _a.amount) / 100 || 0,
        customerId: stripeSubscription.customer,
        subscriptionId: stripeSubscription.id,
        remaining: 0,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        trxId: stripeSubscription.latest_invoice || "N/A",
        status: stripeSubscription.status === "active" ? "active" : "expired",
    };
    console.log("📌 Subscription Data Prepared:");
    console.log(subscriptionData);
    // 💾 Save subscription
    const subscription = yield subscription_model_1.Subscription.create(subscriptionData);
    console.log("✅ Subscription Saved Successfully:", subscription._id);
    // 👤 Update user profile
    yield user_model_1.User.findByIdAndUpdate(userId, {
        subscription: "active",
        paymentStatus: "paid"
    });
    console.log("✅ User subscription field updated to active");
    // ======================================================
    // 🔥 Referral Bonus (20% to referrer ONLY)
    // ======================================================
    console.log("--------------------------------------------------");
    console.log("🔍 Starting Referral Bonus Check");
    const existingSubscriptionsCount = yield subscription_model_1.Subscription.countDocuments({
        user: userId,
    });
    console.log("📊 Total Subscriptions For User:", existingSubscriptionsCount);
    const userDoc = yield user_model_1.User.findById(userId);
    console.log("👤 User Found:", !!userDoc);
    console.log("👤 User Role:", userDoc === null || userDoc === void 0 ? void 0 : userDoc.role);
    console.log("👤 Referred By:", (_b = userDoc === null || userDoc === void 0 ? void 0 : userDoc.referredInfo) === null || _b === void 0 ? void 0 : _b.referredBy);
    console.log("👑 Referred UserId (ObjectId):", (_c = userDoc === null || userDoc === void 0 ? void 0 : userDoc.referredInfo) === null || _c === void 0 ? void 0 : _c.referredUserId);
    if (existingSubscriptionsCount === 1 &&
        ((_d = userDoc === null || userDoc === void 0 ? void 0 : userDoc.referredInfo) === null || _d === void 0 ? void 0 : _d.referredUserId) && // ✅ Use ObjectId now
        userDoc.role === "USER") {
        console.log("✅ Referral Conditions Matched");
        const referrerId = userDoc.referredInfo.referredUserId; // ObjectId
        console.log("👑 Referrer ID:", referrerId);
        const alreadyGiven = yield user_model_1.User.findOne({
            _id: referrerId,
            referralBonusGivenFor: userId
        });
        console.log("🔎 Referral Bonus Already Given?:", !!alreadyGiven);
        if (!alreadyGiven) {
            const subscriptionPrice = subscriptionData.price || 0;
            console.log("💰 Subscription Price:", subscriptionPrice);
            const referralPoints = Math.round(subscriptionPrice * 0.2);
            console.log("🎁 Calculated Referral Points (20%):", referralPoints);
            if (referralPoints > 0) {
                const updatedReferrer = yield user_model_1.User.findByIdAndUpdate(referrerId, {
                    $inc: { points: referralPoints },
                    $push: { referralBonusGivenFor: userId }
                }, { new: true });
                console.log("💎 Referral Points Added Successfully");
                console.log("👑 Updated Referrer Points:", updatedReferrer === null || updatedReferrer === void 0 ? void 0 : updatedReferrer.points);
                // ======================================================
                // 🧾 CREATE POINT TRANSACTION (NEWLY ADDED)
                // ======================================================
                console.log("========== REFERRAL DEBUG START ==========");
                console.log("Referrer ID:", referrerId === null || referrerId === void 0 ? void 0 : referrerId.toString());
                console.log("Referred User ID:", userId === null || userId === void 0 ? void 0 : userId.toString());
                const referralRecord = yield referral_model_1.default.findOne({
                    referrer: referrerId,
                    referredUser: userId // ✅ fixed field name
                });
                console.log("Referral Record Found?:", !!referralRecord);
                if (!referralRecord) {
                    console.log("❌ Referral record NOT FOUND in DB");
                }
                else {
                    console.log("✅ Referral Record ID:", referralRecord._id.toString());
                }
                yield pointTransaction_model_1.default.create({
                    user: referrerId,
                    type: "EARN",
                    source: "REFERRAL",
                    referral: referralRecord === null || referralRecord === void 0 ? void 0 : referralRecord._id,
                    points: referralPoints,
                    note: `Earned ${referralPoints} points from referral subscription (${userId})`
                });
                console.log("🧾 Referral Point Transaction Created");
                console.log("Referral ID Saved:", (referralRecord === null || referralRecord === void 0 ? void 0 : referralRecord._id) || "NULL");
                console.log("========== REFERRAL DEBUG END ==========");
                // ======================================================
                yield (0, notificationsHelper_1.sendNotification)({
                    userIds: [referrerId.toString()],
                    title: "Referral Bonus Earned ",
                    body: `You earned ${referralPoints} points from your referral's subscription.`,
                    type: notification_model_1.NotificationType.REFERRAL
                });
                console.log("📩 Referral Notification Sent");
            }
            else {
                console.log("⚠️ Referral Points <= 0. Bonus Skipped.");
            }
        }
        else {
            console.log("⚠️ Referral Bonus Already Given Previously.");
        }
    }
    else {
        console.log("❌ Referral Conditions NOT Matched");
        console.log({
            isFirstSubscription: existingSubscriptionsCount === 1,
            hasReferrer: !!((_e = userDoc === null || userDoc === void 0 ? void 0 : userDoc.referredInfo) === null || _e === void 0 ? void 0 : _e.referredUserId),
            isUserRole: (userDoc === null || userDoc === void 0 ? void 0 : userDoc.role) === "USER"
        });
    }
    console.log("🔚 Referral Bonus Check Finished");
    console.log("--------------------------------------------------");
    // ======================================================
    // 🎉 Welcome notification
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: [userId.toString()],
        title: "Welcome to the app",
        body: "You have successfully subscribed to our app. We are excited to have you on board!",
        type: notification_model_1.NotificationType.WELCOME
    });
    console.log("📩 Welcome Notification Sent");
    console.log("==================================================");
    console.log("✅ Subscription Activation Process Completed");
    console.log("==================================================");
    return subscription;
});
const cancelSubscription = (user) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ DB থেকে active subscription খুঁজে বের করো
    const subscription = yield subscription_model_1.Subscription.findOne({ user: user._id, status: "active" });
    if (!subscription) {
        throw new Error("Active subscription not found");
    }
    // 2️⃣ Stripe এ cancel_at_period_end set করো
    yield stripe_1.default.subscriptions.update(subscription.subscriptionId, {
        cancel_at_period_end: true
    });
    // 3️⃣ DB তে status update করো (optional: 'cancelling')
    subscription.status = "cancel"; // তুমি চাইলে 'cancelling' রাখতে পারো
    yield subscription.save();
    // 4️⃣ User এর isSubscribed update করতে পারো (optional)
    yield user_model_1.User.findByIdAndUpdate(user.id, { isSubscribed: false });
    return {
        subscriptionId: subscription.subscriptionId,
        currentPeriodEnd: subscription.currentPeriodEnd
    };
});
const subscriptionDetailsFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield subscription_model_1.Subscription.findOne({ user: user.id }).populate("package", "title credit").lean();
    if (!subscription) {
        return { subscription: {} }; // Return empty object if no subscription found
    }
    const subscriptionFromStripe = yield stripe_1.default.subscriptions.retrieve(subscription.subscriptionId);
    // Check subscription status and update database accordingly
    if ((subscriptionFromStripe === null || subscriptionFromStripe === void 0 ? void 0 : subscriptionFromStripe.status) !== "active") {
        yield Promise.all([
            user_model_1.User.findByIdAndUpdate(user.id, { isSubscribed: false }, { new: true }),
            subscription_model_1.Subscription.findOneAndUpdate({ user: user.id }, { status: "expired" }, { new: true }),
        ]);
    }
    return { subscription };
});
const companySubscriptionDetailsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Fetch all subscriptions for the user, populate package details, and sort latest first
    const subscriptions = yield subscription_model_1.Subscription.find({ user: userId })
        .populate("package", "title credit")
        .sort({ createdAt: -1 }) // latest first
        .lean();
    if (!subscriptions || subscriptions.length === 0) {
        return { subscriptions: [] };
    }
    // 2️⃣ Optionally check Stripe status for each subscription and mark expired
    yield Promise.all(subscriptions.map((sub) => __awaiter(void 0, void 0, void 0, function* () {
        let subscriptionFromStripe;
        try {
            subscriptionFromStripe = yield stripe_1.default.subscriptions.retrieve(sub.subscriptionId);
        }
        catch (error) {
            console.warn("Stripe subscription retrieve failed:", error);
            subscriptionFromStripe = null;
        }
        if (!subscriptionFromStripe || subscriptionFromStripe.status !== "active") {
            yield Promise.all([
                user_model_1.User.findByIdAndUpdate(userId, { isSubscribed: false }, { new: true }),
                subscription_model_1.Subscription.findByIdAndUpdate(sub._id, { status: "expired" }, { new: true }),
            ]);
        }
    })));
    return { subscriptions };
});
const subscriptionsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const anyConditions = [];
    const { search, limit, page, paymentType } = query;
    if (search) {
        const matchingPackageIds = yield package_model_1.Package.find({
            $or: [
                { title: { $regex: search, $options: "i" } },
                { paymentType: { $regex: search, $options: "i" } },
            ]
        }).distinct("_id");
        if (matchingPackageIds.length) {
            anyConditions.push({
                package: { $in: matchingPackageIds }
            });
        }
    }
    if (paymentType) {
        anyConditions.push({
            package: { $in: yield package_model_1.Package.find({ paymentType: paymentType }).distinct("_id") }
        });
    }
    const whereConditions = anyConditions.length > 0 ? { $and: anyConditions } : {};
    const pages = parseInt(page) || 1;
    const size = parseInt(limit) || 10;
    const skip = (pages - 1) * size;
    const result = yield subscription_model_1.Subscription.find(whereConditions).populate([
        {
            path: "package",
            select: "title paymentType credit description"
        },
        {
            path: "user",
            select: "email name linkedIn contact company website "
        },
    ])
        .select("user package price trxId currentPeriodStart currentPeriodEnd status")
        .skip(skip)
        .limit(size);
    const count = yield subscription_model_1.Subscription.countDocuments(whereConditions);
    const data = {
        data: result,
        meta: {
            page: pages,
            total: count
        }
    };
    return data;
});
exports.SubscriptionService = {
    createSubscriptionSession,
    activateSubscriptionInDB,
    subscriptionDetailsFromDB,
    subscriptionsFromDB,
    companySubscriptionDetailsFromDB,
    cancelSubscription
};
// batter thinkg but any time need then apply this logic
