import { model, Schema } from "mongoose";
import { IUserPreference } from "./prefrences.interface";



const userPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    datingIntentions: { type: String },
    interestedIn: { type: String },
    languages: { type: String },
    minHeight: { type: Number, min: 30, max: 250 },
    maxHeight: { type: Number, min: 30, max: 250 },
    minAge: { type: Number, min: 30,},
    maxAge: { type: Number, min:250},
    drinking: { type: Boolean, default: false },
    marijuana: { type: Boolean, default: false },
    smoking: { type: Boolean, default: false },
    gender: { type: String },
    children: { type: Boolean, default: false },
    politics: { type: String, default: "Not political" },
    educationLevel: { type: String, default: "Prefer not to say" },
    ethnicity: { type: String },
    zodiacPreference: { type: String },
  },
  { timestamps: true }
);

export const UserPreference = model<IUserPreference>(
  "UserPreference",
  userPreferenceSchema
);
