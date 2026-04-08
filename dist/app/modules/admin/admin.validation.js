"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminValidation = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enums/user");
const createAdminZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Name is required" }),
        email: zod_1.z
            .string({ required_error: "Email is required" })
            .email({ message: "Invalid email address" }),
        password: zod_1.z.string({ required_error: "Password is required" }),
        role: zod_1.z.string({ required_error: "Role is required" }),
    }),
});
const updateUserStausZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(user_1.USER_STATUS),
    }),
});
const updateMerchantApproveStatusZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        approveStatus: zod_1.z.nativeEnum(user_1.APPROVE_STATUS),
    }),
});
exports.AdminValidation = {
    createAdminZodSchema,
    updateUserStausZodSchema,
    updateMerchantApproveStatusZodSchema,
};
