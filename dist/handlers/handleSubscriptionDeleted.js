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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubscriptionDeleted = void 0;
const subscription_model_1 = require("../app/modules/subscription/subscription.model");
const user_model_1 = require("../app/modules/user/user.model");
const handleSubscriptionDeleted = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find active subscription by subscriptionId & customerId
        const activeSub = yield subscription_model_1.Subscription.findOne({
            subscriptionId: data.id,
            customerId: data.customer,
            status: "active",
        });
        if (!activeSub) {
            console.warn(`⚠️ No active subscription found for ID: ${data.id}`);
            return;
        }
        // Update subscription status -> expired
        yield subscription_model_1.Subscription.findByIdAndUpdate(activeSub._id, { status: "expired" }, // 🔥 enum অনুযায়ী expired
        { new: true });
        // Disable user access
        yield user_model_1.User.findByIdAndUpdate(activeSub.user, { hasAccess: false }, { new: true });
        console.log(`✅ Subscription ${data.id} expired & user access revoked.`);
    }
    catch (error) {
        console.error("❌ Subscription Deleted Error:", error);
        // এখানে error throw করবো না, শুধু log করবো যাতে webhook সবসময় 200 return করে
    }
});
exports.handleSubscriptionDeleted = handleSubscriptionDeleted;
