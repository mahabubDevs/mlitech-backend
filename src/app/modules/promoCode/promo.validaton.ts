import z from "zod";

 
 
 
 
 export const createPromoZodSchema = z.object({
  body: z.object({
    promoCode: z.string({ required_error: "Promo code is required" }).min(2),
    discountType: z.enum([
      "Percentage Discount",
      "Fixed Amount Discount",
      "Free Ap",
      "Aura+Trail Day's",
    ]),
    value: z.number({ required_error: "Value is required" }),
    usageLimit: z.number({ required_error: "Usage limit is required" }),
    startDate: z.string({ required_error: "Start date is required" }),
    endDate: z.string({ required_error: "End date is required" }),
  }).superRefine((data, ctx) => {
    if (data.discountType === "Percentage Discount") {
      if (data.value <= 0 || data.value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "Percentage must be between 1 and 100",
        });
      }
    } else if (data.discountType === "Fixed Amount Discount") {
      if (data.value <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "Fixed amount must be greater than 0",
        });
      }
    } else if (data.discountType === "Free Ap" || data.discountType === "Aura+Trail Day's") {
      const allowedValues = [200, 500];
      if (!allowedValues.includes(data.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: `For ${data.discountType}, value must be one of ${allowedValues.join(", ")}`,
        });
      }
    }
  }),
});




export const updatePromoZodSchema = z.object({
  body: z.object({
    promoCode: z.string().min(2).optional(),
    discountType: z
      .enum([
        "Percentage Discount",
        "Fixed Amount Discount",
        "Free Ap",
        "Aura+Trail Day's",
      ])
      .optional(),
    value: z.number().optional(),
    usageLimit: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (!data.discountType || data.value === undefined) return; // optional, skip if not provided

    if (data.discountType === "Percentage Discount") {
      if (data.value <= 0 || data.value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "Percentage must be between 1 and 100",
        });
      }
    } else if (data.discountType === "Fixed Amount Discount") {
      if (data.value <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "Fixed amount must be greater than 0",
        });
      }
    } else if (data.discountType === "Free Ap" || data.discountType === "Aura+Trail Day's") {
      const allowedValues = [200, 500];
      if (!allowedValues.includes(data.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: `For ${data.discountType}, value must be one of ${allowedValues.join(", ")}`,
        });
      }
    }
  }),
});