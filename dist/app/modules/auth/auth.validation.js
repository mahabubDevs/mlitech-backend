"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enums/user");
const createVerifyEmailZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }).email({ message: 'Invalid email address' }),
        oneTimeCode: zod_1.z.number({ required_error: 'One time code is required' })
    })
});
const createLoginZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z
            .string({ required_error: "Email or phone is required" })
            .min(1, "Email or phone is required"),
        password: zod_1.z
            .string({ required_error: "Password is required" })
            .min(1, "Password is required"),
    }),
});
const createForgetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z
            .string({ required_error: "Phone number or email is required" })
            .refine((val) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // standard email
            const phoneRegex = /^\+[1-9]\d{6,14}$/; // international phone with country code
            return emailRegex.test(val) || phoneRegex.test(val);
        }, {
            message: "Identifier must be a valid email or phone number with country code (+)",
        }),
    }),
});
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const createResetPasswordZodSchema = zod_1.z
    .object({
    body: zod_1.z.object({
        newPassword: zod_1.z
            .string({ required_error: 'Password is required' })
            .regex(passwordRegex, 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character'),
        confirmPassword: zod_1.z.string({ required_error: 'Confirm Password is required' }),
    }),
})
    .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: "New password and confirm password must match",
    path: ["body", "confirmPassword"],
});
const createChangePasswordZodSchema = zod_1.z
    .object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string({
            required_error: 'Current Password is required',
        }),
        newPassword: zod_1.z
            .string({ required_error: 'New Password is required' }),
        // .regex(
        //   passwordRegex,
        //   'Password must be at least 8 characters, include uppercase, lowercase, number, and special character'
        // ),
        confirmPassword: zod_1.z.string({
            required_error: 'Confirm Password is required',
        }),
    }),
})
    .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: "New password and confirm password must match",
    path: ["body", "confirmPassword"],
});
const createVerifyOtpZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z.string({ required_error: "Phone number or email is required" })
            .refine((val) => {
            const phoneRegex = /^\+?[0-9]{6,15}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return phoneRegex.test(val) || emailRegex.test(val);
        }, { message: "Identifier must be a valid phone number or email" }),
        oneTimeCode: zod_1.z.number({ required_error: "OTP is required" }),
    }),
});
const googleLoginZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        idToken: zod_1.z.string({ required_error: 'ID token is required' }),
        role: zod_1.z.enum([user_1.USER_ROLES.MERCENT]).optional()
    })
});
exports.AuthValidation = {
    createVerifyEmailZodSchema,
    createForgetPasswordZodSchema,
    createLoginZodSchema,
    createResetPasswordZodSchema,
    createChangePasswordZodSchema,
    createVerifyOtpZodSchema,
    googleLoginZodSchema
};
