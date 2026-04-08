"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTierSchema = exports.createTierSchema = void 0;
const zod_1 = require("zod");
// Create Tier Schema
exports.createTierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, { message: "Tier name is required" }),
    pointsThreshold: zod_1.z.coerce
        .number({ invalid_type_error: "Points threshold must be a number" })
        .nonnegative({ message: "Points threshold must be >= 0" }),
    reward: zod_1.z.string().min(1, { message: "Reward is required" }),
    accumulationRule: zod_1.z.coerce
        .number({ invalid_type_error: "Accumulation rule must be a number" })
        .min(1, { message: "Accumulation rule must be >= 1" }),
    redemptionRule: zod_1.z.coerce
        .number({ invalid_type_error: "Redemption rule must be a number" })
        .min(0, { message: "Redemption rule must be >= 0" }),
    minTotalSpend: zod_1.z.coerce
        .number({ invalid_type_error: "Minimum total spend must be a number" })
        .nonnegative({ message: "Minimum total spend must be >= 0" }),
    isActive: zod_1.z.coerce.boolean().optional(),
});
// Update Tier Schema
exports.updateTierSchema = exports.createTierSchema.partial();
