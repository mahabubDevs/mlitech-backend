"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShopZodSchema = exports.createShopZodSchema = void 0;
const zod_1 = require("zod");
exports.createShopZodSchema = zod_1.z.object({
    bundleType: zod_1.z.enum(["call", "aura"], { required_error: "Bundle type is required" }),
    status: zod_1.z.enum(["active", "block"]).optional(),
    callBundle: zod_1.z
        .object({
        enterTime: zod_1.z.number({ required_error: "Enter time is required" }),
        neededAura: zod_1.z.number({ required_error: "Needed aura is required" }),
    })
        .optional(),
    auraBundle: zod_1.z
        .object({
        auraNumber: zod_1.z.number({ required_error: "Aura number is required" }),
        amount: zod_1.z.number({ required_error: "Amount is required" }),
    })
        .optional(),
    createdBy: zod_1.z.string({ required_error: "CreatedBy is required" }),
});
exports.updateShopZodSchema = zod_1.z.object({
    status: zod_1.z.enum(["active", "block"]).optional(),
    callBundle: zod_1.z
        .object({
        enterTime: zod_1.z.number().optional(),
        neededAura: zod_1.z.number().optional(),
    })
        .optional(),
    auraBundle: zod_1.z
        .object({
        auraNumber: zod_1.z.number().optional(),
        amount: zod_1.z.number().optional(),
    })
        .optional(),
});
