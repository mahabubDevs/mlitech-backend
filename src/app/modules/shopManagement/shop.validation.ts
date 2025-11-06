import { z } from "zod";

export const createShopZodSchema = z.object({
  bundleType: z.enum(["call", "aura"], { required_error: "Bundle type is required" }),
  status: z.enum(["active", "block"]).optional(),
  callBundle: z
    .object({
      enterTime: z.number({ required_error: "Enter time is required" }),
      neededAura: z.number({ required_error: "Needed aura is required" }),
    })
    .optional(),
  auraBundle: z
    .object({
      auraNumber: z.number({ required_error: "Aura number is required" }),
      amount: z.number({ required_error: "Amount is required" }),
    })
    .optional(),
  createdBy: z.string({ required_error: "CreatedBy is required" }),
});

export const updateShopZodSchema = z.object({
  status: z.enum(["active", "block"]).optional(),
  callBundle: z
    .object({
      enterTime: z.number().optional(),
      neededAura: z.number().optional(),
    })
    .optional(),
  auraBundle: z
    .object({
      auraNumber: z.number().optional(),
      amount: z.number().optional(),
    })
    .optional(),
});
