"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminActionZodSchema = exports.createReportZodSchema = void 0;
const zod_1 = require("zod");
const report_interface_1 = require("./report.interface");
// User creates a report
exports.createReportZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        reportedUserId: zod_1.z.string({ required_error: "Reported User ID is required" }),
        reason: zod_1.z.string({ required_error: "Reason is required" }),
    }),
});
// Admin updates a report
exports.adminActionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        reportId: zod_1.z.string({ required_error: "Report ID is required" }),
        status: zod_1.z.nativeEnum(report_interface_1.REPORT_STATUS, { required_error: "Status is required" }),
        warning: zod_1.z.string().optional(),
    }),
});
