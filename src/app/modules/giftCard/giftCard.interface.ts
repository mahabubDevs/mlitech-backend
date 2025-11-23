import { Types } from "mongoose";
import { IGiftCard } from "./giftCard.model";
import { IDigitalCard } from "./digitalCard.model";

export interface IFindCustomerByCardResult {
  customer: any | null; // replace 'any' with your IUser interface if available
  digitalCard: IDigitalCard | null;
  giftCards: IGiftCard[];
}

// Payload for buying a gift card (user redeems)
export interface IBuyGiftCardPayload {
  merchantId: string | Types.ObjectId;
  userId: string | Types.ObjectId; // buyer user id
  points: number;
  expiry?: Date | string | null;
  code?: string; // optional custom code
  tierId?: string | Types.ObjectId | null; // optional, if user redeems tier-specific gift card
  discount?: number | null; // optional, discount value applied
}

// Payload for creating a gift card (merchant creates)
export interface ICreateGiftCardPayload {
  merchantId: string | Types.ObjectId;
  points: number;
  expiry?: Date | string | null;
  code?: string; // optional custom code
  userId?: string | Types.ObjectId | null; // optional, user-specific gift card
  tierId?: string | Types.ObjectId | null; // optional, tier-specific gift card
  discount?: number | null; // optional, fixed or tier discount %
}
