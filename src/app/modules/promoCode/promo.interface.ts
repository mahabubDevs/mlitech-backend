import { Types } from "mongoose";

export type DiscountType = "Percentage Discount" | "Fixed Amount Discount" | "Free Ap" | "Aura+Trail Day's";

export interface ICreatePromo {
  promoCode: string;
  discountType: DiscountType;
  value: number;
  usageLimit: number;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  image?: string;
  createdBy: string;
}

export interface IUpdatePromo extends Partial<ICreatePromo> {}

export interface IPromoDB extends ICreatePromo {
  _id: string;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// For User applying promo
export interface IApplyPromo {
  userId: string;
  promoCode: string;
}

export interface IAppliedPromoResult {
  promoCode: string;
  discount: {
    type: DiscountType;
    value: number;
  };
}
