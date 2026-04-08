"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRatingValidation = void 0;
const zod_1 = require("zod");
exports.createRatingValidation = zod_1.z.object({
    body: zod_1.z.object({
        digitalCardId: zod_1.z.string(),
        promotionId: zod_1.z.string(),
        merchantId: zod_1.z.string(),
        rating: zod_1.z.number().min(1).max(5),
        comment: zod_1.z.string().optional(),
    }),
});
