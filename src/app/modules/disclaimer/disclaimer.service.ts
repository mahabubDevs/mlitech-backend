import { JwtPayload } from "jsonwebtoken";
import { IDisclaimer } from "./disclaimer.interface";
import { Disclaimer } from "./disclaimer.model";
import { notifyAllActiveUsers } from "../../../helpers/notifiyAllActiveUsers";
import { NotificationType } from "../notification/notification.model";

// create or update disclaimer
const createUpdateDisclaimer = async (
  payload: IDisclaimer,
  user: JwtPayload
) => {
  const result = await Disclaimer.findOneAndUpdate(
    { type: payload.type },
    { $set: payload },
    { new: true, upsert: true }
  );

  await notifyAllActiveUsers({
    title: payload.type === 'customer-privacy-policy' ? 'Privacy Policy Updated' : 'Terms and Conditions Updated',
    body: payload.type === 'customer-privacy-policy' ? 'Privacy Policy have been updated.' : 'Terms and Conditions have been updated.',
    type: NotificationType.POLICY,

  });

  return result;
};

// get all disclaimer
const getAllDisclaimer = async (type: string) => {
  const result = await Disclaimer.findOne({ type });
  return result;
};

export const DisclaimerServices = { createUpdateDisclaimer, getAllDisclaimer };
