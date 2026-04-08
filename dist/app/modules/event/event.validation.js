"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventZodSchema = void 0;
const zod_1 = require("zod");
exports.createEventZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventName: zod_1.z.string({ required_error: "Event name is required" }).min(2),
        eventType: zod_1.z.enum(["Unlimited Ad Time", "Unlimited Games", "Unlimited Select City", "Off APshop"]),
        state: zod_1.z.string({ required_error: "State is required" }),
        image: zod_1.z.string().optional(),
        startDate: zod_1.z.string({ required_error: "Start date is required" }),
        endDate: zod_1.z.string({ required_error: "End date is required" }),
        selectedGame: zod_1.z.string().optional(),
        offAPPercentage: zod_1.z.number().optional(),
        createdBy: zod_1.z.string({ required_error: "Created by user ID is required" }),
    }).refine((data) => {
        // Unlimited Games হলে selectGame required
        if (data.eventType === "Unlimited Games") {
            return data.selectedGame && data.selectedGame.trim() !== "";
        }
        return true;
    }, { path: ["selectedGame"], message: "selectedGame is required for Unlimited Games" }).refine((data) => {
        // Off APshop হলে offAPPercentage required
        if (data.eventType === "Off APshop") {
            return data.offAPPercentage !== undefined && data.offAPPercentage !== null;
        }
        return true;
    }, { path: ["offAPPercentage"], message: "offAPPercentage is required for Off APshop" }),
});
