"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPushZodSchema = void 0;
const zod_1 = require("zod");
exports.createPushZodSchema = zod_1.z.object({
    title: zod_1.z.string({ required_error: "Title is required" }).min(1, "Title cannot be empty"),
    body: zod_1.z.string({ required_error: "Body is required" }).min(1, "Body cannot be empty"),
    state: zod_1.z.string({ required_error: "State is required" }).min(1, "State cannot be empty"),
});
