import { z } from "zod";

export const createEventZodSchema = z.object({
  body: z.object({
    eventName: z.string({ required_error: "Event name is required" }).min(2),
    eventType: z.enum(["Unlimited Ad Time", "Unlimited Games", "Unlimited Select City", "Off APshop"]),
    state: z.string({ required_error: "State is required" }),
    image: z.string().optional(),
    startDate: z.string({ required_error: "Start date is required" }),
    endDate: z.string({ required_error: "End date is required" }),
    selectedGame: z.string().optional(),
    offAPPercentage: z.number().optional(),
    createdBy: z.string({ required_error: "Created by user ID is required" }),
  }).refine(
    (data) => {
      // Unlimited Games হলে selectGame required
      if (data.eventType === "Unlimited Games") {
        return data.selectedGame && data.selectedGame.trim() !== "";
      }
      return true;
    },
    { path: ["selectedGame"], message: "selectedGame is required for Unlimited Games" }
  ).refine(
    (data) => {
      // Off APshop হলে offAPPercentage required
      if (data.eventType === "Off APshop") {
        return data.offAPPercentage !== undefined && data.offAPPercentage !== null;
      }
      return true;
    },
    { path: ["offAPPercentage"], message: "offAPPercentage is required for Off APshop" }
  ),
});
