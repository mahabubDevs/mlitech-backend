import { Types } from "mongoose";
import { IGiftCard } from "./giftCard.model";
import { IDigitalCard } from "./digitalCard.model";

// interfaces/giftCard.interface.ts


export interface IFindCustomerByCardResult {
  customer: any | null;
  digitalCard: Partial<IDigitalCard> & {
    merchant?: { businessName: string; photo: string } | null;
  } | null;
  giftCards: any[];
}

// Payload for buying a gift card (user redeems)
export interface IBuyGiftCardPayload {
  giftCardId: string;
  userId: string;
}

// Payload for creating a gift card (merchant creates)
export interface ICreateGiftCardPayload {
  title: string;
  merchantId: string | Types.ObjectId;
  points: number;
  expiry?: Date | string | null;
  code?: string; // optional custom code
  userId?: string | Types.ObjectId | null; // optional, user-specific gift card
  tierId?: string | Types.ObjectId | null; // optional, tier-specific gift card
  status?: "active" | "pending" | "approved" | "redeem";
  // discount?: number | null; // optional, fixed or tier discount %
}
