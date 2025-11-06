// src/app/modules/userPreference/userPreference.validation.ts
import { z } from "zod";

// Base schema
const basePreferenceSchema = {
  datingIntentions: z.string().optional(),
  interestedIn: z.string().optional(),
  languages: z.string().optional(),
  age: z.number().min(18).max(100).optional(),
  height: z.number().min(30).max(250).optional(),
  minHeight: z.number().min(30).max(250).optional(),
  maxHeight: z.number().min(30).max(250).optional(),
  drinking: z.boolean().optional(),
  marijuana: z.boolean().optional(),
  smoking: z.boolean().optional(),
  gender: z.string().optional(),
  children: z.boolean().optional(),
  politics: z.string().optional(),
  educationLevel: z.string().optional(),
  ethnicity: z.string().optional(),
  zodiacPreference: z.string().optional(),
};

// ✅ Create Validation
export const createUserPreferenceSchema = z.object({
  body: z.object(basePreferenceSchema),
});

// ✅ Update Validation (partial update allowed)
export const updateUserPreferenceSchema = z.object({
  body: z.object(basePreferenceSchema).partial(),
});
