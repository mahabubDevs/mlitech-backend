"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavoriteValidation = void 0;
const zod_1 = require("zod");
exports.addFavoriteValidation = zod_1.z.object({
    body: zod_1.z.object({
        merchantId: zod_1.z.string(),
    }),
});
