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
const colors_1 = __importDefault(require("colors"));
const handlers_1 = require("../handlers");
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../shared/logger");
const config_1 = __importDefault(require("../config"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const stripe_1 = __importDefault(require("../config/stripe"));
const subscription_service_1 = require("../app/modules/subscription/subscription.service");
const handleStripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("=======================>>Received Stripe webhook");
    const signature = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.webhookSecret;
    console.log("webhook", signature, webhookSecret);
    let event;
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        console.error("❌ Webhook verification failed:", error);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const userId = session.client_reference_id;
                const packageId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.packageId;
                const subscriptionId = session.subscription;
                if (!userId || !packageId || !subscriptionId) {
                    throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid session metadata");
                }
                const stripeSubscription = yield stripe_1.default.subscriptions.retrieve(subscriptionId);
                console.log("inside checkout.session.completed webhook handler");
                // Save subscription in DB
                yield subscription_service_1.SubscriptionService.activateSubscriptionInDB(userId, packageId, stripeSubscription);
                break;
            case 'customer.subscription.created':
                yield (0, handlers_1.handleSubscriptionCreated)(event.data.object);
                break;
            case 'customer.subscription.updated':
                yield (0, handlers_1.handleSubscriptionUpdated)(event.data.object);
                break;
            case 'customer.subscription.deleted':
                yield (0, handlers_1.handleSubscriptionDeleted)(event.data.object);
                break;
            case 'account.updated':
                yield (0, handlers_1.handleAccountUpdatedEvent)(event.data.object);
                break;
            default:
                logger_1.logger.warn(colors_1.default.bgGreen.bold(`Unhandled event type: ${event.type}`));
        }
    }
    catch (error) {
        console.error("❌ Error handling event:", error);
        return res.status(500).send(`Webhook handler failed: ${error.message}`);
    }
    return res.status(200).send({ received: true });
});
exports.default = handleStripeWebhook;
