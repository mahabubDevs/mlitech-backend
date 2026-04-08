"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisclaimerValidations = void 0;
const zod_1 = require("zod");
const disclaimer_constants_1 = require("./disclaimer.constants");
// create validation schema for disclaimer
const createUpdateDisclaimerZodSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        type: zod_1.z.nativeEnum(disclaimer_constants_1.DisclaimerTypes, {
            required_error: 'Type is required',
        }),
        content: zod_1.z
            .string({ required_error: 'Content is required' })
            .nonempty('Content cannot be empty'),
    })
        .strict(),
});
// get disclaimer by type validation schema
const getDisclaimerByTypeZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        type: zod_1.z.nativeEnum(disclaimer_constants_1.DisclaimerTypes, {
            required_error: 'Type is required',
        }),
    }),
});
exports.DisclaimerValidations = {
    createUpdateDisclaimerZodSchema,
    getDisclaimerByTypeZodSchema,
};
