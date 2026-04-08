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
exports.SubscriptionController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const subscription_service_1 = require("./subscription.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { packageId } = req.body;
    if (!req.user)
        throw new Error("User not found");
    if (!packageId)
        throw new Error("Package ID is required");
    const userId = req.user._id || req.user.id;
    if (!userId)
        throw new Error("User ID not found");
    const session = yield subscription_service_1.SubscriptionService.createSubscriptionSession(userId, packageId);
    if (session.url) {
        // Paid plan → Stripe redirect
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Stripe checkout session created successfully",
            data: session
        });
    }
    else {
        // Free plan → no redirect
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Free plan activated successfully",
            data: session.subscription
        });
    }
}));
const cancelSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user)
        throw new Error("User not found");
    const result = yield subscription_service_1.SubscriptionService.cancelSubscription(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Your subscription will be cancelled at the end of current period",
        data: result
    });
}));
const subscriptions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscription_service_1.SubscriptionService.subscriptionsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Subscription List Retrieved Successfully",
        data: result
    });
}));
const subscriptionDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user)
        throw new Error("User not found");
    const result = yield subscription_service_1.SubscriptionService.subscriptionDetailsFromDB(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Subscription Details Retrieved Successfully",
        data: result.subscription
    });
}));
const companySubscriptionDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscription_service_1.SubscriptionService.companySubscriptionDetailsFromDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Company Subscription Details Retrieved Successfully",
        data: result.subscriptions || [], // ✅ Always return array
    });
}));
exports.SubscriptionController = {
    createSubscription,
    subscriptions,
    subscriptionDetails,
    companySubscriptionDetails,
    cancelSubscription
};
