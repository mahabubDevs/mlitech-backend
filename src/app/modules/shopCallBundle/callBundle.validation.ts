import { z } from "zod";

export const createPackageSchema = z.object({
  totaltime: z.number(),
  totalap: z.number(),
});
