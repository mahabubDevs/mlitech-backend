"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageValidation = void 0;
const zod_1 = require("zod");
const createPackageZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: "Title is required" }),
        description: zod_1.z.string({ required_error: "Description is required" }),
        price: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
            .transform(val => typeof val === 'string' ? parseFloat(val) : val)
            .refine(val => !isNaN(val), { message: "Price must be a valid number" })
            .refine(val => val >= 0, { message: "Price cannot be negative" }),
        duration: zod_1.z.enum(["1 month", "4 months", "8 months", "1 year"], { required_error: "Duration is required" }),
        // paymentType: z.enum(["Monthly", "Yearly"], { required_error: "Payment type is required" }),
        features: zod_1.z.array(zod_1.z.string(), { required_error: "Features are required" }),
        loginLimit: zod_1.z.number({ required_error: "Login limit is required" }).min(1),
        credit: zod_1.z.number({ required_error: "Credit is required" }).min(0),
    })
});
exports.PackageValidation = { createPackageZodSchema };
