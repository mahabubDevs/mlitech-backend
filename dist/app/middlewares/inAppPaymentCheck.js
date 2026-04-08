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
exports.verifyAndroidReceipt = exports.verifyIosReceipt = void 0;
// src/util/iapVerifier.ts
const axios_1 = __importDefault(require("axios"));
const googleapis_1 = require("googleapis");
const verifyIosReceipt = (receipt) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post("https://buy.itunes.apple.com/verifyReceipt", {
            'receipt-data': receipt,
            'password': process.env.IOS_SHARED_SECRET,
        });
        return response.data.status === 0; // 0 means valid
    }
    catch (err) {
        return false;
    }
});
exports.verifyIosReceipt = verifyIosReceipt;
// Android Google Play Verification
const verifyAndroidReceipt = (packageName, productId, purchaseToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Service Account Key
        const keyFile = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || "./GOOGLE_PLAY_SERVICE_ACCOUNT_KEY.json";
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile,
            scopes: ["https://www.googleapis.com/auth/androidpublisher"],
        });
        const androidPublisher = googleapis_1.google.androidpublisher({
            version: "v3",
            auth,
        });
        // Verify purchase
        const res = yield androidPublisher.purchases.products.get({
            packageName,
            productId,
            token: purchaseToken,
        });
        // purchaseState = 0 means purchased
        return res.data.purchaseState === 0;
    }
    catch (err) {
        console.error("Google Play verification error:", err);
        return false;
    }
});
exports.verifyAndroidReceipt = verifyAndroidReceipt;
