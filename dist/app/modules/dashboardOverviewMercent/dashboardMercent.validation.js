"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMercentValidation = void 0;
const zod_1 = require("zod");
const totalRevenueZodSchema = zod_1.z.object({
    query: zod_1.z.object({
        start: zod_1.z.preprocess((val) => (val ? new Date(val) : undefined), zod_1.z.date({
            required_error: "Start Date is required",
        })),
        end: zod_1.z.preprocess((val) => (val ? new Date(val) : undefined), zod_1.z.date({
            required_error: "End Date is required",
        })),
    }),
});
const getStatisticsForAdminDashboardZodSchema = zod_1.z.object({
    query: zod_1.z.object({
        range: zod_1.z.enum(["today", "7d", "30d", "all"]).optional().default("7d"),
    }),
});
const getYearlyRevenueZodSchema = zod_1.z.object({
    query: zod_1.z.object({
        start: zod_1.z
            .preprocess((val) => (val ? new Date(val) : undefined), zod_1.z.date({
            message: "Start Date is invalid",
        }))
            .optional(),
        end: zod_1.z
            .preprocess((val) => (val ? new Date(val) : undefined), zod_1.z.date({
            required_error: "End Date is invalid",
        }))
            .optional(),
    }),
});
exports.DashboardMercentValidation = {
    totalRevenueZodSchema,
    getStatisticsForAdminDashboardZodSchema,
    getYearlyRevenueZodSchema,
};
