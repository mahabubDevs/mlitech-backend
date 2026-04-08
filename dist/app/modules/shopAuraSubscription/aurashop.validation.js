"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackageSchema = void 0;
const zod_1 = require("zod");
exports.createPackageSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    price: zod_1.z.number(),
    duration: zod_1.z.enum(["1 day", "1 week", "1 month", "3 months", "6 months", "1 year"])
});
