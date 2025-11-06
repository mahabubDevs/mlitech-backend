import { z } from "zod";

export const createPackageSchema = z.object({
  totalap: z.number(),
  price: z.number(),
});
