
import { Types } from "mongoose";
import { DigitalCard } from "../digitalCard/digitalCard.model";
import { Rating } from "./rating.model";


const createRating = async (
  userId: string,
  digitalCardId: string,
  promotionId: string,
  merchantId: string,
  rating: number,
  comment?: string
) => {

  // user এর কার্ড কি সত্যিই আছে?
  const card = await DigitalCard.findOne({
    _id: new Types.ObjectId(digitalCardId),
    userId: new Types.ObjectId(userId)
  });

  if (!card) {
    throw new Error("Digital card not found for user");
  }

  // আগের রেটিং check
  const alreadyRated = await Rating.findOne({
    userId: new Types.ObjectId(userId),
    promotionId: new Types.ObjectId(promotionId),
  });

  if (alreadyRated) {
    throw new Error("You already rated this promotion");
  }

  // rating create
  const create = await Rating.create({
    userId: new Types.ObjectId(userId),
    merchantId: new Types.ObjectId(merchantId),
    promotionId: new Types.ObjectId(promotionId),
    digitalCardId: new Types.ObjectId(digitalCardId),
    rating,
    comment,
  });

  return create;
};

const getMerchantRatings = async (merchantId: string) => {
  return await Rating.find({
    merchantId: new Types.ObjectId(merchantId),
  }).sort({ createdAt: -1 });
};

export const RatingService = {
  createRating,
  getMerchantRatings,
};
