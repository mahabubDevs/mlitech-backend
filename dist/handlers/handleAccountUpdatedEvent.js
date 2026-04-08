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
exports.handleAccountUpdatedEvent = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const stripe_1 = __importDefault(require("../config/stripe"));
const user_model_1 = require("../app/modules/user/user.model");
const handleAccountUpdatedEvent = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the user by Stripe account ID
        const existingUser = yield user_model_1.User.findOne({
            "stripeAccountInfo.accountId": data.id,
        });
        if (!existingUser) {
            console.warn(`⚠️ No user found for account ID: ${data.id}`);
            return; // ❌ Error throw করার দরকার নেই, শুধু log করাই যথেষ্ট
        }
        // Always prepare update object
        const updateData = {
            "stripeAccountInfo.accountId": data.id,
            "stripeAccountInfo.detailsSubmitted": data.details_submitted,
            "stripeAccountInfo.chargesEnabled": data.charges_enabled,
            "stripeAccountInfo.payoutsEnabled": data.payouts_enabled,
        };
        // If account is active and charges enabled, create a login link
        if (data.charges_enabled) {
            const loginLink = yield stripe_1.default.accounts.createLoginLink(data.id);
            updateData["stripeAccountInfo.loginUrl"] = loginLink.url;
        }
        // Save updates to DB
        yield user_model_1.User.findByIdAndUpdate(existingUser._id, updateData, {
            new: true,
            runValidators: true,
        });
        console.log(`✅ Stripe account updated for user ${existingUser._id}`);
    }
    catch (err) {
        console.error("❌ Error in handleAccountUpdatedEvent:", err);
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Account update failed");
    }
});
exports.handleAccountUpdatedEvent = handleAccountUpdatedEvent;
