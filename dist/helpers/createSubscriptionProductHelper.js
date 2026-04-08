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
exports.createSubscriptionProduct = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../config/stripe"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const createSubscriptionProduct = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, price, duration, description } = payload;
    // 🔹 Validation
    if (!title || price === undefined || price === null || !duration) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Title, price, and duration are required");
    }
    // 🔹 Free plan handle
    if (price === 0) {
        return {
            productId: "FREE_PLAN",
            priceId: "FREE_PLAN",
        };
    }
    // 1️⃣ Create Product in Stripe
    const product = yield stripe_1.default.products.create({
        name: title,
        description: description !== null && description !== void 0 ? description : "",
    });
    // =========================
    // ✅ FIX START
    // =========================
    // 🔹 Extract number from duration (e.g. "4 months" → 4)
    const durationNumber = parseInt(((_a = duration.toString().match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || "1");
    // 🔹 Normalize duration string
    const lowerDuration = duration.toLowerCase();
    // 🔹 Detect interval type
    let interval = "month";
    if (lowerDuration.includes("year")) {
        interval = "year";
    }
    else if (lowerDuration.includes("month")) {
        interval = "month";
    }
    // =========================
    // ✅ FIX END
    // =========================
    // 2️⃣ Create Stripe Price (🔥 MAIN FIX HERE)
    const stripePrice = yield stripe_1.default.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100), // cents
        currency: "usd",
        recurring: {
            interval,
            interval_count: durationNumber, // ✅ FIX: supports 4 months, 2 years, etc.
        },
    });
    return {
        productId: product.id,
        priceId: stripePrice.id,
    };
});
exports.createSubscriptionProduct = createSubscriptionProduct;
