"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCashToken = generateCashToken;
const crypto_1 = __importDefault(require("crypto"));
function generateCashToken() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 8; i++) {
        const randomIndex = crypto_1.default.randomInt(0, chars.length);
        token += chars[randomIndex];
    }
    return token;
}
