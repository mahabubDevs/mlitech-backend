import { z } from "zod";

const validateTokenZodSchema = z.object({
  body: z.object({
    token: z.string({ required_error: "Cash Token is required" }),
  }),
});

export const SalesRepValidation = {
  validateTokenZodSchema,
};
