import { Types } from "mongoose";
import { Promotion } from "../../mercent/promotionMercent/promotionMercent.model";
import { DigitalCard } from "./digitalCard.model";
import { generateCardCode } from "./generateCardCode";

// const addPromotionToDigitalCard = async (
//   userId: string,
//   promotionId: string
// ) => {

//   // Promotion check
//   const promotion = await Promotion.findById(promotionId);
//   if (!promotion) {
//     throw new Error("Promotion not found");
//   }

//   const merchantId = promotion.merchantId;

//   // Digital card check (user + merchant)
//   let digitalCard = await DigitalCard.findOne({ userId, merchantId });

//   // If digital card does not exist → create new
//   if (!digitalCard) {
//     digitalCard = await DigitalCard.create({
//       userId,
//       merchantId,
//       cardCode: generateCardCode(),
//       promotions: [],
//     });
//   }

//   // Convert promotionId → ObjectId
//   const promotionObjectId = new Types.ObjectId(promotionId);

//   // Add promotion if not exists already
//   if (!digitalCard.promotions.includes(promotionObjectId)) {
//     digitalCard.promotions.push(promotionObjectId);
//   }

//   // Save changes
//   await digitalCard.save();

//   return digitalCard;
// };


const addPromotionToDigitalCard = async (
  userId: string,
  promotionId: string
) => {

  // Promotion check
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new Error("Promotion not found");
  }

  const merchantId = promotion.merchantId;

  // Digital card check (user + merchant)
  let digitalCard = await DigitalCard.findOne({ userId, merchantId });

  // If digital card does not exist → create new
  if (!digitalCard) {
    digitalCard = await DigitalCard.create({
      userId,
      merchantId,
      cardCode: generateCardCode(),
      promotions: [],
    });
  }

  // Convert promotionId → ObjectId
  const promotionObjectId = new Types.ObjectId(promotionId);

  // Add promotion if not exists already
  const alreadyAdded = digitalCard.promotions.some(p =>
    p.promotionId && p.promotionId.equals(promotionObjectId)
  );

  if (!alreadyAdded) {
    digitalCard.promotions.push({
      promotionId: promotionObjectId,
      status: "unused", // default status
      usedAt: null,
    });
  }

  await digitalCard.save();

  // Populate promotion details for response
  await digitalCard.populate({
    path: "promotions.promotionId",
    model: "PromotionMercent",
  });

  // Format response
  const allPromotions = digitalCard.promotions.map(promo => ({
    cardCode: digitalCard.cardCode,
    status: promo.status,
    usedAt: promo.usedAt,
    promotion: promo.promotionId,
  }));

  return {
    totalPromotions: allPromotions.length,
    promotions: allPromotions,
  };
};

const getUserAddedPromotions = async (userId: string) => {
  // Nested populate for promotionId inside promotions array
  const digitalCards = await DigitalCard.find({ userId }).populate({
    path: "promotions.promotionId",
    model: "PromotionMercent",
  });

  // Flatten array with cardCode, status, usedAt, and populated promotion details
  const allPromotions = digitalCards.flatMap(card =>
    card.promotions.map(promo => ({
      cardCode: card.cardCode,
      status: promo.status,
      usedAt: promo.usedAt || null,
      promotion: promo.promotionId,
    }))
  );

  return {
    totalPromotions: allPromotions.length,
    promotions: allPromotions,
  };
};

const getUserDigitalCards = async (userId: string) => {
  const digitalCards = await DigitalCard.find({ userId })
    .populate({
      path: "merchantId",
      select: "firstName businessName profile"
    });

  // Format promotions array to only include promotionId
  const formattedCards = digitalCards.map(card => ({
    _id: card._id,
    userId: card.userId,
    merchantId: card.merchantId,
    cardCode: card.cardCode,
    availablePoints: card.availablePoints ?? 0,
    promotions: card.promotions.map(p => p.promotionId?.toString()).filter(Boolean), // only IDs
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    __v: card.__v
  }));

  return {
    totalDigitalCards: formattedCards.length,
    digitalCards: formattedCards
  };
};


const getPromotionsOfDigitalCard = async (digitalCardId: string) => {
  const digitalCard = await DigitalCard.findById(digitalCardId)
    .populate("promotions"); // সমস্ত promotion details নিয়ে আসে

  if (!digitalCard) {
    throw new Error("Digital Card not found");
  }

  return {
    totalPromotions: digitalCard.promotions.length,
    promotions: digitalCard.promotions,
  };
};



const getMerchantDigitalCardWithPromotions = async (merchantId: string, cardCode: string) => {
    
  const digitalCard = await DigitalCard.findOne({ merchantId, cardCode })
  
    .populate({
      path: "promotions",
      match: { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } } // only valid promotions
    });

  if (!digitalCard) {
    return null; // No Digital Card found for this merchant or invalid cardCode
  }

  // If digital card has no promotions after date filter → return null
  if (!digitalCard.promotions || digitalCard.promotions.length === 0) {
    return null;
  }

  // Add availablePoints field (default 0 if not exist)
//   const availablePoints = digitalCard.availablePoints ?? 0;

  return {
    digitalCard,
    // availablePoints,
  };
};





export const DigitalCardService = {
  addPromotionToDigitalCard,
  getUserAddedPromotions,
  getUserDigitalCards,
  getPromotionsOfDigitalCard,
  getMerchantDigitalCardWithPromotions
};
