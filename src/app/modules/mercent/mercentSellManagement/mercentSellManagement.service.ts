import { Types } from "mongoose";

import { Promotion } from "../../mercent/promotionMercent/promotionMercent.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import { Sell } from "./mercentSellManagement.model";


const checkout = async (
  merchantId: string,
  digitalCardCode: string,
  totalBill: number,
  promotionId?: string
) => {

  // 1. Find Digital Card
  const digitalCard = await DigitalCard.findOne({
    merchantId: new Types.ObjectId(merchantId),
    cardCode: digitalCardCode
  });

  if (!digitalCard) {
    throw new Error("Digital Card not found for this merchant");
  }

  let discount = 0;
  let selectedPromotion = null;

  // 2. Handle Promotion if provided
  if (promotionId) {
    selectedPromotion = await Promotion.findById(promotionId);
    if (!selectedPromotion) {
      throw new Error("Promotion not found");
    }

    // Find the promotion in DigitalCard
    const promoIndex = digitalCard.promotions.findIndex(
      p => p.promotionId?.toString() === promotionId
    );

    if (promoIndex === -1) {
      throw new Error("Promotion not added to this DigitalCard");
    }

    const promo = digitalCard.promotions[promoIndex];

    // Check promotion status
    if (promo.status === "unused") {
      // Use it
      promo.status = "used";
      promo.usedAt = new Date();
      discount = selectedPromotion.discountPercentage || 0;
    } else if (promo.status === "pending") {
      throw new Error("User approval needed for this promotion");
    } else if (promo.status === "used" || promo.status === "expired") {
      throw new Error("Promotion already used or expired");
    }

    // Save DigitalCard update
    await digitalCard.save();
  }

  // 3. Calculate discounted bill
  const discountedBill = totalBill - (totalBill * discount) / 100;

  // 4. Points earned
  const pointsEarned = discountedBill;

  // 5. Update DigitalCard points
  digitalCard.availablePoints = (digitalCard.availablePoints || 0) + pointsEarned;
  await digitalCard.save();

  // 6. Save transaction
  const sell = await Sell.create({
    merchantId,
    userId: digitalCard.userId,
    digitalCardId: digitalCard._id,
    promotionId: selectedPromotion?._id,
    totalBill,
    discountedBill,
    pointsEarned
  });

  return sell;
};

export const SellService = { checkout };
