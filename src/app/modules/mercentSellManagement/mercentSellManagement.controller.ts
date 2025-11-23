// merchantSellManagement.service.ts

import { GiftCard } from "../giftCard/giftCard.model";
import { User } from "../user/user.model";
import { ICompleteTransactionPayload } from "./mercentSellManagement.interface";
import { Transaction } from "./mercentSellManagement.model";


const findCustomerFromDB = async (cardId: string) => {
  const customer = await User.findOne({ cardId });

  if (!customer) return { customer: null, giftCards: [] };

  const giftCards = await GiftCard.find({ customerId: customer._id });

  return { customer, giftCards };
};

const calculateFromDB = async (data: any) => {
  const { totalBill, redeemPoints = 0, giftCardCode } = data;

  let giftCardDeduction = 0;

  if (giftCardCode) {
    const giftCard = await GiftCard.findOne({ code: giftCardCode });

    if (giftCard) {
      giftCardDeduction = Math.min(giftCard.points, totalBill);
    }
  }

  const finalAmount = totalBill - redeemPoints - giftCardDeduction;
  const earnedPoints = Math.floor(finalAmount / 10);

  return {
    totalBill,
    redeemPoints,
    giftCardDeduction,
    earnedPoints,
    finalAmount: finalAmount < 0 ? 0 : finalAmount,
  };
};

const completeTransactionToDB = async (payload: ICompleteTransactionPayload) => {
  const calc = await calculateFromDB(payload);

  const transaction = await Transaction.create({
    merchantId: payload.merchantId,
    customerId: payload.customerId,
    totalBill: payload.totalBill,
    redeemedPoints: payload.redeemPoints ?? 0,
    usedGiftCard: payload.giftCardCode || null,
    giftCardDeducted: calc.giftCardDeduction,
    earnedPoints: calc.earnedPoints,
    finalAmount: calc.finalAmount,
  });

  return transaction;
};

export const MerchantSellManagementService = {
  findCustomerFromDB,
  calculateFromDB,
  completeTransactionToDB,
};
