"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const verifyReferralZodSchema = zod_1.default.object({
    body: zod_1.default.object({
        referralId: zod_1.default.string({ required_error: "Referral Id is required" }),
    }),
});
exports.ReferralValidation = {
    verifyReferralZodSchema,
};
