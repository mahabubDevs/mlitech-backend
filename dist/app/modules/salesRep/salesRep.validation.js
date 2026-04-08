"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesRepValidation = void 0;
const zod_1 = require("zod");
const validateTokenZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string({ required_error: "Cash Token is required" }),
    }),
});
const createSalesRepDataZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        packageId: zod_1.z.string({ required_error: "Package Id is required" }),
    }),
});
exports.SalesRepValidation = {
    validateTokenZodSchema,
    createSalesRepDataZodSchema,
};
