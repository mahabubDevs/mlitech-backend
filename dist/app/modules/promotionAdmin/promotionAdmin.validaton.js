"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePromotionSchema = exports.createPromotionSchema = void 0;
const zod_1 = require("zod");
// Create & Update Promotion Schema
exports.createPromotionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Promotion name is required"),
    customerReach: zod_1.z.number({ invalid_type_error: "Customer reach must be a number" }),
    discountPercentage: zod_1.z.number({ invalid_type_error: "Discount percentage must be a number" }),
    promotionType: zod_1.z.string().min(1, "Promotion type is required"),
    customerSegment: zod_1.z.string().min(1, "Customer segment is required"),
    startDate: zod_1.z.preprocess(arg => new Date(arg), zod_1.z.date()),
    endDate: zod_1.z.preprocess(arg => new Date(arg), zod_1.z.date()),
});
// Optional: for partial update
exports.updatePromotionSchema = exports.createPromotionSchema.partial();
