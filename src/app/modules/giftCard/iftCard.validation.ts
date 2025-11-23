import { z } from "zod";

export const buyGiftCardSchema = z.object({
  userId: z.string().min(1),
  points: z.coerce.number().positive(),
  expiry: z.string().optional().nullable(),
  code: z.string().optional(),
  tierId: z.string().optional().nullable(),
  discount: z.coerce.number().optional().nullable(),
});

export const findByUniqueIdSchema = z.object({
  uniqueId: z.string().min(1),
});

export const createGiftCardSchema = z.object({
  points: z.coerce.number().nonnegative(),
  expiry: z.string().optional().nullable(),
  code: z.string().optional(),
  userId: z.string().optional().nullable(),
  tierId: z.string().optional().nullable(),
  discount: z.coerce.number().optional().nullable(),
});

export const basicQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  searchTerm: z.string().optional(),
});
