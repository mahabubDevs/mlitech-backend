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
exports.handleSubscriptionUpdated = void 0;
const stripe_1 = __importDefault(require("../config/stripe"));
const subscription_model_1 = require("../app/modules/subscription/subscription.model");
const user_model_1 = require("../app/modules/user/user.model");
const package_model_1 = require("../app/modules/package/package.model");
// import { Package } from "../app/modules/shopAuraSubscription/aurashop.module";
const handleSubscriptionUpdated = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const subscription = data;
        // Retrieve customer details
        const customer = (yield stripe_1.default.customers.retrieve(subscription.customer));
        if (!(customer === null || customer === void 0 ? void 0 : customer.email)) {
            console.warn("⚠️ No email found for the customer!");
            return;
        }
        // Find user by email
        const existingUser = yield user_model_1.User.findOne({ email: customer.email });
        if (!existingUser) {
            console.warn(`⚠️ User not found for email: ${customer.email}`);
            return;
        }
        // Extract priceId from subscription
        const priceId = (_b = (_a = subscription.items.data[0]) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.id;
        if (!priceId) {
            console.warn("⚠️ No priceId found in subscription items.");
            return;
        }
        // Find matching package
        const pricingPlan = yield package_model_1.Package.findOne({ priceId });
        if (!pricingPlan) {
            console.warn(`⚠️ No pricing plan found for priceId: ${priceId}`);
            return;
        }
        // Get invoice if exists
        let trxId = "";
        let amountPaid = 0;
        if (subscription.latest_invoice) {
            try {
                const invoice = yield stripe_1.default.invoices.retrieve(subscription.latest_invoice);
                trxId = invoice === null || invoice === void 0 ? void 0 : invoice.payment_intent;
                amountPaid = (invoice === null || invoice === void 0 ? void 0 : invoice.total) ? invoice.total / 100 : 0;
            }
            catch (err) {
                console.warn("⚠️ Invoice not found, continuing...");
            }
        }
        // Dates
        const currentPeriodStart = subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : null;
        const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;
        const subscriptionId = subscription.id;
        const price = subscription.items.data[0].price.unit_amount / 100;
        const remaining = subscription.items.data[0].quantity || 1;
        // ✅ Find existing active subscription with package populated
        const currentActiveSubscription = yield subscription_model_1.Subscription.findOne({
            user: existingUser._id,
            status: "active",
        }).populate("package");
        if (currentActiveSubscription) {
            const oldPackageId = (_d = (_c = currentActiveSubscription.package) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString();
            // যদি package change হয়ে থাকে বা oldPackageId না থাকে
            if (!oldPackageId || oldPackageId !== pricingPlan._id.toString()) {
                yield subscription_model_1.Subscription.findByIdAndUpdate(currentActiveSubscription._id, {
                    status: "expired", // enum অনুযায়ী
                });
                // নতুন subscription create
                yield subscription_model_1.Subscription.create({
                    user: existingUser._id,
                    customerId: customer.id,
                    package: pricingPlan._id,
                    status: "active",
                    trxId,
                    amountPaid,
                    price,
                    subscriptionId,
                    currentPeriodStart,
                    currentPeriodEnd,
                    remaining,
                });
                yield user_model_1.User.findByIdAndUpdate(existingUser._id, { role: "PAIDUSER" });
                console.log(`🔄 Subscription upgraded for user ${existingUser.email}`);
            }
            else {
                console.log(`ℹ️ Subscription already active for the same package.`);
            }
        }
        else {
            // যদি active subscription না থাকে
            yield subscription_model_1.Subscription.create({
                user: existingUser._id,
                customerId: customer.id,
                package: pricingPlan._id,
                status: "active",
                trxId,
                amountPaid,
                price,
                subscriptionId,
                currentPeriodStart,
                currentPeriodEnd,
                remaining,
            });
            yield user_model_1.User.findByIdAndUpdate(existingUser._id, { role: "PAIDUSER" });
            console.log(`✅ Subscription created for user ${existingUser.email}`);
        }
    }
    catch (error) {
        console.error("❌ Subscription Updated Error:", error);
        // throw না করে শুধু log করা, যাতে webhook সবসময় 200 return করে
    }
});
exports.handleSubscriptionUpdated = handleSubscriptionUpdated;
