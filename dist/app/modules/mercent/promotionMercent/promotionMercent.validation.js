"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionValidations = exports.updatePromotionSchema = exports.createPromotionSchema = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../../enums/user");
// Allowed days
const allowedDays = [
    "all",
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
];
// Create Promotion Schema
exports.createPromotionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Promotion name is required"),
    discountPercentage: zod_1.z.number({
        invalid_type_error: "Discount percentage must be a number",
    }),
    promotionType: zod_1.z.string().min(1, "Promotion type is required"),
    customerSegment: zod_1.z.string().min(1, "Customer segment is required"),
    startDate: zod_1.z.preprocess((arg) => new Date(arg), zod_1.z.date()),
    endDate: zod_1.z.preprocess((arg) => new Date(arg), zod_1.z.date()),
    availableDays: zod_1.z
        .array(zod_1.z.enum(allowedDays))
        .nonempty("At least one day must be selected")
        .optional(), // optional field, default will be ["all"]
    image: zod_1.z.string().optional(),
    grossValue: zod_1.z.number({
        invalid_type_error: "Gross value must be a number",
    }),
});
// Update Promotion Schema (partial)
exports.updatePromotionSchema = exports.createPromotionSchema.partial();
const getUserTierOfMerchantZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        merchantId: zod_1.z.string().min(1, { message: "Merchant id is required" }),
    }),
});
const sendNotificationToCustomerZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        segment: zod_1.z.nativeEnum(user_1.CUSTOMER_SEGMENT),
        minPoints: zod_1.z.coerce.number(),
        radiusKm: zod_1.z.coerce.number().min(1, { message: "Location radius is required" }),
        message: zod_1.z.string().min(1, { message: "Message is required" }),
    }),
});
exports.PromotionValidations = {
    getUserTierOfMerchantZodSchema,
    sendNotificationToCustomerZodSchema,
};
