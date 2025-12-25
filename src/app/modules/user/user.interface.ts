import { Model, Types } from "mongoose";
import {
  APPROVE_STATUS,
  USER_REPORT,
  USER_ROLES,
  USER_STATUS,
} from "../../../enums/user";

export interface IStripeAccountInfo {
  status: string;
  stripeAccountId: string;
  externalAccountId: string;
  currency: string;
}

export interface IAuthenticationProps {
  isResetPassword?: boolean;

  // Email OTP
  emailOTP?: {
    code?: number;
    expireAt?: Date;
  };

  // Phone OTP
  phoneOTP?: {
    code?: number;
    expireAt?: Date;
  };
}

// export interface IUserPreferences {
//   datingIntentions?: ("Life partner" | "Long-Term Relationship" | "Short-time Relationship" | "Does Not Matter")[];
//   interestedIn?: ("Man" | "Women" | "NonBinary" | "Everyone")[];
//   languages?: string[];
//   height?: number;
//   minHeight?: number;
//   maxHeight?: number;
//   drinking?: "Yes" | "No" | "Occasionally";
//   marijuana?: "Yes" | "No" | "Occasionally";
//   smoking?: "Yes" | "No" | "Occasionally";
//   gender?: "Man" | "Women" | "Non-Binary" | "Trans Man" | "Trans Woman";
//   children?: "Yes" | "No" | "Someday" | "Prefer not to say";
//   politics?: "Liberal" | "Conservative" | "Moderate" | "Not political" | "Other";
//   educationLevel?: "High School" | "Undergrad" | "Postgrad" | "Prefer not to say";
//   ethnicity?: string[];
//   zodiacPreference?: string;
// }

// export type IUser = {
//     _id: Types.ObjectId;
//     name: string;
//     userName?: string;
//     appId: string;
//     role: USER_ROLES;
//     contact: string;
//     email: string;
//     password: string;
//     location: string;
//     profile: string;
//     verified: boolean;
//     authentication?: IAuthenticationProps;
//     accountInformation?: IStripeAccountInfo;
//     stripeAccountId?: string;
//     pages?: string[];
//     customeRole?: string;

//     // ----- Preferences -----
//   preferences?: IUserPreferences;

// }

export type GenderOption =
  | "MAN"
  | "WOMEN"
  | "NON-BINARY"
  | "TRANS MAN"
  | "TRANS WOMAN";

export type EthnicityOption =
  | "Black / Africa Decent"
  | "East Asia"
  | "Hispanic/Latino"
  | "Middle Eastern"
  | "Native American"
  | "Pacific Islander"
  | "South Asian"
  | "Southeast Asian"
  | "White Caucasion"
  | "Other"
  | "Open to All"
  | "Pisces";

export interface IUser {
  _id?: Types.ObjectId;
  customUserId: string;
  merchantId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  appId?: string;
  fcmToken?: string;
  referenceId: string;
  referredInfo?: {
    referredId: string;
    referredBy: string;
  };
  salesRep?: string;
  role?: string;
  phone?: string;
  email?: string;
  password?: string;
  website?: string;
  country?: string;
  city?: string;
  service?: string;
  subscription?: string;
  prefreances?: string[];
  about?: string;
  address?: string;
  location?: {
    type: "Point";
    coordinates: number[];
  };
  profile?: string;
  documentVerified?: string[];
  photo?: string;
  verified?: boolean;
  status: USER_STATUS;
  approveStatus?: APPROVE_STATUS;
  lastStatusChanged?: Date;
  userReport: USER_REPORT;
  stripeAccountId?: string;
  authentication?: IAuthenticationProps;
  accountInformation?: IStripeAccountInfo;
  gender?: string;
  lastActive: Date;
  socketIds: string[];
  points: number;
  totalVisits: number;
}

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isExistUserByPhone(phone: string): any;
  isAccountCreated(id: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;


export interface CreateUserPayload
  extends IUser {
  referredId?: string; // input-only field
}
