import crypto from "crypto";
import { User } from "../app/modules/user/user.model";

export const generateReferralId = () => {
  const id = crypto.randomBytes(4).toString("hex").toUpperCase();
  // → 8 chars, A-F + 0-9
  return id;
};
export const createUniqueReferralId = async () => {
  let referralId;

  while (true) {
    referralId = generateReferralId();
    const exists = await User.exists({ referralId });

    if (!exists) break;
  }

  return referralId;
};
