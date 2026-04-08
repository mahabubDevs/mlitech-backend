"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTransactionSchema = exports.calculateSchema = exports.findCustomerSchema = void 0;
// merchantSellManagement.validation.ts
const zod_1 = require("zod");
exports.findCustomerSchema = zod_1.z.object({
    cardId: zod_1.z.string().min(1),
});
exports.calculateSchema = zod_1.z.object({
    totalBill: zod_1.z.coerce.number().nonnegative(),
    redeemPoints: zod_1.z.coerce.number().nonnegative().optional(),
    giftCardCode: zod_1.z.string().optional(),
    pointRedeemed: zod_1.z.coerce.number().nonnegative().optional(),
});
exports.completeTransactionSchema = zod_1.z.object({
    merchantId: zod_1.z.string().optional(),
    customerId: zod_1.z.string(),
    totalBill: zod_1.z.coerce.number().nonnegative(),
    redeemPoints: zod_1.z.coerce.number().nonnegative().optional().default(0),
    pointRedeemed: zod_1.z.coerce.number().nonnegative().optional().default(0),
    giftCardCode: zod_1.z.string().optional(),
});
