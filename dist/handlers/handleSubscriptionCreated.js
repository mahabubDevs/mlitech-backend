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
exports.handleSubscriptionCreated = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const stripe_1 = __importDefault(require("../config/stripe"));
const subscription_model_1 = require("../app/modules/subscription/subscription.model");
const user_model_1 = require("../app/modules/user/user.model");
const package_model_1 = require("../app/modules/package/package.model");
// ==============================
// handleSubscriptionCreated
// ==============================
// ======= Updated handleSubscriptionCreated =======
const handleSubscriptionCreated = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log('=================>> Received Stripe webhook (subscription.created)');
    try {
        const subscription = yield stripe_1.default.subscriptions.retrieve(data.id);
        const customer = (yield stripe_1.default.customers.retrieve(subscription.customer));
        if (!(customer === null || customer === void 0 ? void 0 : customer.email))
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No email found for the customer!');
        const existingUser = yield user_model_1.User.findOne({ email: customer.email });
        if (!existingUser)
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `User not found: ${customer.email}`);
        const priceId = (_b = (_a = subscription.items.data[0]) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.id;
        const allPackages = yield package_model_1.Package.find({});
        const pricingPlan = allPackages.find(pkg => pkg.priceId === priceId || Object.values(pkg.priceIdWithPoints || {}).includes(priceId));
        if (!pricingPlan)
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Pricing plan not found for priceId: ${priceId}`);
        // ====== Invoice & Pricing ======
        const invoice = yield stripe_1.default.invoices.retrieve(subscription.latest_invoice);
        const trxId = invoice === null || invoice === void 0 ? void 0 : invoice.payment_intent;
        const amountPaid = (invoice === null || invoice === void 0 ? void 0 : invoice.total) ? invoice.total / 100 : 0;
        const mainPrice = pricingPlan.price; // package মূল দাম
        const currentPrice = amountPaid; // subscription শেষ দাম
        const priceDifference = mainPrice - currentPrice; // points হিসেবে deduct হবে
        console.log(`🔹 Subscription Prices: mainPrice=${mainPrice}, currentPrice=${currentPrice}, priceDifference=${priceDifference}`);
        // ====== Deduct points from user ======
        if (priceDifference > 0) {
            const pointsToDeduct = Math.min(priceDifference, existingUser.points || 0); // user points check
            if (pointsToDeduct > 0) {
                yield user_model_1.User.findByIdAndUpdate(existingUser._id, { $inc: { points: -pointsToDeduct } });
                console.log(`💎 Deducted ${pointsToDeduct} points from user ${existingUser._id}`);
            }
            else {
                console.log("ℹ️ User has no points to deduct");
            }
        }
        // ====== Referral Bonus (first paid subscription only) ======
        // const existingSubscriptions = await Subscription.countDocuments({ user: existingUser._id });
        // if (
        //   existingSubscriptions === 0 && // first paid subscription
        //   existingUser.referredInfo?.referredBy && // has referrer
        //   existingUser.role === "user" // only normal users
        // ) {
        //   const referrerId = existingUser.referredInfo.referredBy;
        //   const alreadyGiven = await User.findOne({
        //     _id: referrerId,
        //     "referralBonusGivenFor": existingUser._id
        //   });
        //   if (!alreadyGiven) {
        //     const referralPoints = Math.round(currentPrice * 0.2);
        //     await User.findByIdAndUpdate(referrerId, {
        //       $inc: { points: referralPoints },
        //       $push: { referralBonusGivenFor: existingUser._id } // prevent duplicate bonus
        //     });
        //     console.log(`💎 Added ${referralPoints} referral points to user ${referrerId}`);
        //   } else {
        //     console.log("ℹ️ Referral bonus already given for this user, skipping.");
        //   }
        // } else {
        //   console.log("ℹ️ No referral bonus applicable.");
        // }
        // ====== Subscription period & save ======
        const currentPeriodStart = subscription.current_period_start;
        const currentPeriodEnd = subscription.current_period_end;
        const subscriptionId = subscription.id;
        const remaining = subscription.items.data[0].quantity || 1;
        const existingSubscription = yield subscription_model_1.Subscription.findOne({
            user: existingUser._id,
            package: pricingPlan._id,
            subscriptionId
        });
        if (existingSubscription) {
            console.log("ℹ️ Subscription already exists, skipping creation");
            return;
        }
        const newSubscription = new subscription_model_1.Subscription({
            user: existingUser._id,
            customerId: customer.id,
            package: pricingPlan._id,
            status: 'active',
            trxId,
            amountPaid: currentPrice,
            price: mainPrice,
            subscriptionId,
            currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
            currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
            remaining,
            source: 'online',
        });
        yield newSubscription.save();
        yield user_model_1.User.findByIdAndUpdate(existingUser._id, { subscription: 'active' });
        console.log("✅ Subscription saved and user updated");
    }
    catch (error) {
        console.error("❌ Subscription Created Error:", error);
        throw error;
    }
});
exports.handleSubscriptionCreated = handleSubscriptionCreated;
