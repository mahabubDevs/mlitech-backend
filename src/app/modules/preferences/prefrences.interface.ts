
import { model, Schema, Types } from "mongoose";


export interface IUserPreference {
  userId: Types.ObjectId; // মূল User-এর reference
  datingIntentions?: string;
  interestedIn?: string;
  languages?: string;
  age?: number;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  minAge?: number;
  maxAge?: number;
  drinking?: boolean;
  marijuana?: boolean;
  smoking?: boolean;
  gender?: string;
  children?: boolean;
  politics?: string;
  educationLevel?: string;
  ethnicity?: string;
  zodiacPreference?: string;
  // আরও fields লাগলে যোগ করতে পারেন
}


const userPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    datingIntentions: { type: String },
    interestedIn: { type: String },
    languages: { type: String },
    age: { type: Number },
    height: { type: Number, min: 30, max: 250 },
    minHeight: { type: Number, min: 30, max: 250 },
    maxHeight: { type: Number, min: 30, max: 250 },
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
