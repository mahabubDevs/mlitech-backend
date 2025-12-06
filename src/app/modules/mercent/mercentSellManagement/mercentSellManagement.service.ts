import { Types } from "mongoose";
import { Promotion } from "../../mercent/promotionMercent/promotionMercent.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import { Sell } from "./mercentSellManagement.model";


// -----------------------------
// 1. Merchant → Checkout
// -----------------------------
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
  let selectedPromotion: any = null;

  // 2. Handle Promotion if provided
  if (promotionId) {
    selectedPromotion = await Promotion.findById(promotionId);

    if (!selectedPromotion) {
      throw new Error("Promotion not found");
    }

    // Find promotion inside digital card
    const promoIndex = digitalCard.promotions.findIndex(
      p => p.promotionId?.toString() === promotionId
    );

    if (promoIndex === -1) {
      throw new Error("Promotion not added to this DigitalCard");
    }

    const promo = digitalCard.promotions[promoIndex];

    // Check promotion status
    if (promo.status === "unused") {
      promo.status = "used";
      promo.usedAt = new Date();

      discount = selectedPromotion.discountPercentage || 0;
    } else if (promo.status === "pending") {
      throw new Error("User approval needed for this promotion");
    } else {
      throw new Error("Promotion already used or expired");
    }

    await digitalCard.save();
  }

  // 3. Calculate discounted bill
  const discountedBill = totalBill - (totalBill * discount) / 100;

  // 4. Points earned
  const pointsEarned = discountedBill;

  // 5. Update digital card points
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


// -----------------------------
// 2. Merchant → Request Approval
// -----------------------------
// const requestApproval = async (
//   merchantId: string,
//   digitalCardCode: string,
//   promotionId: string
// ) => {

//   const digitalCard = await DigitalCard.findOne({
//     merchantId: new Types.ObjectId(merchantId),
//     cardCode: digitalCardCode,
//   });

//   if (!digitalCard) {
//     throw new Error("Digital card not found for this merchant");
//   }

//   const promo = digitalCard.promotions.find(
//     (p) => p.promotionId?.toString() === promotionId
//   );

//   if (!promo) {
//     throw new Error("Promotion not found in digital card");
//   }

//   if (promo.status !== "pending") {
//     throw new Error("Promotion does not require approval");
//   }

//   // এখানে চাইলে push notification পাঠাতে পারো
//   // notifyUser(digitalCard.userId, "Merchant requested approval");

//   return { userId: digitalCard.userId };
// };


// // -----------------------------
// // 3. User → Approve Promotion
// // -----------------------------
// const approvePromotion = async (
//   digitalCardId: string,
//   promotionId: string,
//   userId: string
// ) => {

//   const digitalCard = await DigitalCard.findOne({
//     _id: new Types.ObjectId(digitalCardId),
//     userId: new Types.ObjectId(userId),
//   });

//   if (!digitalCard) {
//     throw new Error("Digital card not found for user");
//   }

//   const promo = digitalCard.promotions.find(
//     (p) => p.promotionId?.toString() === promotionId
//   );

//   if (!promo) {
//     throw new Error("Promotion not found in card");
//   }

//   if (promo.status !== "pending") {
//     throw new Error("Promotion already approved or used");
//   }

//   // Approval done
//   promo.status = "unused";

//   await digitalCard.save();

//   return { status: "approved" };
// };






// -----------------------------
// EXPORT SERVICE
// -----------------------------
export const SellService = { 
  checkout,
  // requestApproval,
  // approvePromotion
};
