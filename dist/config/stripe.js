"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const _1 = __importDefault(require("."));
const stripe = new stripe_1.default(_1.default.stripe.stripeSecretKey, {
    apiVersion: '2024-06-20',
});
exports.default = stripe;
