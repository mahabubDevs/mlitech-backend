import { z } from "zod";

export const buyGiftCardSchema = z.object({
  giftCardId: z.string().min(1), // user now just provides giftCardId
});


export const findByUniqueIdSchema = z.object({
  uniqueId: z.string().min(1),
});

export const createGiftCardSchema = z.object({
  body: z.object({
    title: z.string(),
    code: z.string().optional(),
    merchantId: z.string().min(1).optional(),
    userId: z.string().optional().nullable(),
    tierId: z.string().optional().nullable(),
    digitalCardId: z.string().optional().nullable(),
    points: z.coerce.number().nonnegative(), // coerce string -> number
    isActive: z.boolean().optional(),
    expiry: z.string().optional().nullable(),
  })
});

// Update GiftCard Validation (PATCH / PUT)
export const updateGiftCardSchema = z.object({
  // code: z.string().optional(),
  userId: z.string().optional().nullable(),
  tierId: z.string().optional().nullable(),
  digitalCardId: z.string().optional().nullable(),
  points: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  expiry: z.string().optional().nullable(),
});


export const basicQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  searchTerm: z.string().optional(),
});
