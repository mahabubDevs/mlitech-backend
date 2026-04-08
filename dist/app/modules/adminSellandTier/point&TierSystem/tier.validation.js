"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTierSchema = exports.createTierSchema = void 0;
const zod_1 = require("zod");
exports.createTierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Tier name is required"),
    pointsThreshold: zod_1.z.coerce
        .number()
        .nonnegative("Points threshold must be >= 0"),
    reward: zod_1.z.string().min(1, "Reward is required"),
    accumulationRule: zod_1.z.number().min(1, "Accumulation rule is required"),
    redemptionRule: zod_1.z.number().min(0, "Redemption rule is required"),
    minTotalSpend: zod_1.z.coerce
        .number()
        .nonnegative("Minimum total spend must be >= 0"),
    isActive: zod_1.z.coerce.boolean().optional(),
});
exports.updateTierSchema = exports.createTierSchema.partial();
