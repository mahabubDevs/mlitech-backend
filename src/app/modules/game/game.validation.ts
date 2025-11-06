import { z } from "zod";

// Create Game Schema
export const createGameZodSchema = z.object({
  gameTitle: z
    .string({ required_error: "Game title is required" })
    .min(2, "Game title must be at least 2 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .min(5, "Description must be at least 5 characters"),
  createdBy: z.string({ required_error: "CreatedBy is required" }),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Update Game Schema
export const updateGameZodSchema = z.object({
  gameTitle: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});
