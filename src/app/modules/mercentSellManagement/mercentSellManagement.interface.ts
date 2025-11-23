// merchantSellManagement.interface.ts
import { Types } from "mongoose";

export interface IFindCustomerResult {
  customer: any | null;
  giftCards: any[];
}

export interface ICompleteTransactionPayload {
  merchantId?: string | Types.ObjectId;
  customerId: string | Types.ObjectId;
  totalBill: number;
  redeemPoints?: number;
  giftCardCode?: string;
}
