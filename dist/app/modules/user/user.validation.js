"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const createAdminZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Name is required" }),
        email: zod_1.z
            .string({ required_error: "Email is required" })
            .email({ message: "Invalid email address" }),
        password: zod_1.z.string({ required_error: "Password is required" }),
        role: zod_1.z.string({ required_error: "Role is required" }),
        fcmToken: zod_1.z.string().optional(),
    }),
});
const createUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string({ required_error: "First name is required" }),
        // lastName: z.string({ required_error: 'Last name is required' }),
        country: zod_1.z.string({ required_error: "countrey" }).optional(),
        phone: zod_1.z
            .string({ required_error: "Phone number is required" })
            .min(7, "Phone number must be at least 7 characters")
            .max(15, "Phone number must be at most 15 characters"),
        email: zod_1.z
            .string({ required_error: "Email is required" })
            .email({ message: "Invalid email address" }),
        password: zod_1.z
            .string({ required_error: "Password is required" })
            .min(8, "Password must be at least 8 characters")
            .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/, "Password must contain at least one letter, one number, and one special character"),
        role: zod_1.z.enum(["MERCENT", "USER"]),
        // gender: z.enum(["MAN", "WOMEN", "NON-BINARY", "TRANS MAN", "TRANS WOMAN"]).optional()
        // phoneNumber: z.string({ required_error: 'Phone number is required' }),
        // location: z.string({ required_error: 'Location is required' }),
    }),
});
const updateUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().optional(), // keep as is
        lastName: zod_1.z.string().optional(), // keep as is
        appId: zod_1.z.string().optional(), // keep as is
        fcmToken: zod_1.z.string().optional(), // keep as is
        role: zod_1.z
            .enum(["SUPER_ADMIN", "ADMIN", "USER"])
            .optional()
            .transform((val) => val === null || val === void 0 ? void 0 : val.toLowerCase()),
        // phoneNumber: z.string().optional(), // keep as is
        email: zod_1.z
            .string()
            .email({ message: "Invalid email address" })
            .optional()
            .transform((val) => val === null || val === void 0 ? void 0 : val.toLowerCase()),
        // phone: z.string().optional(), // keep as is
        password: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters")
            .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/, "Password must contain at least one letter, one number, and one special character")
            .optional(),
        // keep as is
        latitude: zod_1.z
            .string({
            required_error: "Latitude is required",
            invalid_type_error: "Latitude must be a string",
        })
            .optional(),
        longitude: zod_1.z
            .string({
            required_error: "Longitude is required",
            invalid_type_error: "Longitude must be a string",
        })
            .optional(),
        profile: zod_1.z.string().url().optional(), // keep as is
        documentVerified: zod_1.z.array(zod_1.z.string()).optional(), // keep as is
        photo: zod_1.z.string().optional(), // keep as is
        about: zod_1.z.string({
            required_error: "About Us is required",
        })
            .max(200, "About Us must not exceed 200 characters").optional(),
        emailVerified: zod_1.z.boolean().optional(),
        phoneVerified: zod_1.z.boolean().optional(),
        verified: zod_1.z.boolean().optional(),
        accountInformation: zod_1.z
            .object({
            status: zod_1.z.boolean().optional(),
            stripeAccountId: zod_1.z.string().optional(), // keep as is
            externalAccountId: zod_1.z.string().optional(), // keep as is
            currency: zod_1.z.string().optional(), // keep as is
        })
            .optional(),
        pages: zod_1.z.array(zod_1.z.string().transform((val) => val.toLowerCase())).optional(),
        //   notificationSettings: z
        // .object({
        //   promotionalEmails: z.boolean().optional(),
        //   appNotifications: z.boolean().optional(),
        //   smsNotifications: z.boolean().optional(),
        //   referralNotifications: z.boolean().optional(),
        //   subscriptionNotifications: z.boolean().optional(),
        //   pushNotifications: z.boolean().optional(),
        // })
        // .optional(),
        datingIntentions: zod_1.z
            .string()
            .optional()
            .transform((val) => val === null || val === void 0 ? void 0 : val.toLowerCase()),
        interestedIn: zod_1.z
            .string()
            .optional()
            .transform((val) => val === null || val === void 0 ? void 0 : val.toLowerCase()),
        languages: zod_1.z
            .string()
            .optional()
            .transform((val) => val === null || val === void 0 ? void 0 : val.toLowerCase()),
        age: zod_1.z.number().min(18).max(100).optional(),
        height: zod_1.z.number().min(30).max(250).optional(),
        minHeight: zod_1.z.number().min(30).max(250).optional(),
        maxHeight: zod_1.z.number().min(30).max(250).optional(),
        address: zod_1.z.string().optional(),
        drinking: zod_1.z.boolean().optional(),
        marijuana: zod_1.z.boolean().optional(),
        smoking: zod_1.z.boolean().optional(),
        balance: zod_1.z.number().optional(),
        availableTime: zod_1.z.number().optional(),
        gender: zod_1.z
            .enum(["MAN", "WOMEN", "NON-BINARY", "TRANS MAN", "TRANS WOMAN"])
            .optional(),
        children: zod_1.z.boolean().optional(),
        politics: zod_1.z
            .string()
            .optional()
            .transform((val) => val === null || val === void 0 ? void 0 : val.toLowerCase()),
        educationLevel: zod_1.z
            .string()
            .optional()
            .transform((val) => val === null || val === void 0 ? void 0 : val.toLowerCase()),
        ethnicity: zod_1.z
            .enum([
            "Black / Africa Decent",
            "East Asia",
            "Hispanic/Latino",
            "Middle Eastern",
            "Native American",
            "Pacific Islander",
            "South Asian",
            "Southeast Asian",
            "White Caucasion",
            "Other",
            "Open to All",
            "Pisces",
        ])
            .optional(),
        zodiacPreference: zod_1.z
            .string()
            .optional()
            .transform((val) => val === null || val === void 0 ? void 0 : val.toLowerCase()),
    }),
});
exports.UserValidation = {
    createAdminZodSchema,
    createUserZodSchema,
    updateUserZodSchema,
};
// const updateUserZodSchema = z.object({
//   body: z.object({
//     firstName: z.string().optional(),
//     lastName: z.string().optional(),
//     appId: z.string().optional(),
//     role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).optional(),
//     phoneNumber: z.string().optional(),
//     email: z.string().email({ message: "Invalid email address" }).optional(),
//     phone: z.string().optional(),
//     password: z.string().min(8, "Password must be at least 8 characters").optional(),
//     location: z.string().optional(),
//     profile: z.string().url().optional(),
//     documentVerified: z.array(z.string()).optional(),
//     photo: z.string().optional(),
//     emailVerified: z.boolean().optional(),
//     phoneVerified: z.boolean().optional(),
//     verified: z.boolean().optional(),
//     accountInformation: z
//       .object({
//         status: z.boolean().optional(),
//         stripeAccountId: z.string().optional(),
//         externalAccountId: z.string().optional(),
//         currency: z.string().optional(),
//       })
//       .optional(),
//     pages: z.array(z.string()).optional(),
//     // তোমার model এ এগুলো string, তাই array না করে string রেখেছি
//     datingIntentions: z.string().optional(),
//     interestedIn: z.string().optional(),
//     languages: z.string().optional(),
//     age: z.number().min(18).max(100).optional(),
//     height: z.number().min(30).max(250).optional(),
//     minHeight: z.number().min(30).max(250).optional(),
//     maxHeight: z.number().min(30).max(250).optional(),
//     drinking: z.boolean().optional(),
//     marijuana: z.boolean().optional(),
//     smoking: z.boolean().optional(),
//     gender: z.string().optional(),
//     children: z.boolean().optional(),
//     politics: z.string().optional(),
//     educationLevel: z.string().optional(),
//     ethnicity: z.string().optional(),
//     zodiacPreference: z.string().optional(),
//   }),
// });
// export const UserValidation = {
//     createAdminZodSchema,
//     createUserZodSchema,
//     updateUserZodSchema
// };
