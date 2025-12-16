import { Favorite } from "./favorite.model";
import { Types } from "mongoose";

const addFavorite = async (userId: string, merchantId: string) => {
  const result = await Favorite.create({
    userId: new Types.ObjectId(userId),
    merchantId: new Types.ObjectId(merchantId),
  });

  return result;
};

const getUserFavorites = async (userId: string) => {
  return await Favorite.find({
    userId: new Types.ObjectId(userId),
  })
    .populate({
      path: "merchantId", // Favorite model এ যেই ফিল্ডে userId reference আছে
      model: "User",      // User model থেকে populate করবে
      select: "name email role" // শুধু দরকারি field দেখাবে
    })
    .sort({ createdAt: -1 });
};


const removeFavorite = async (userId: string, merchantId: string) => {
  const result = await Favorite.findOneAndDelete({
    userId: new Types.ObjectId(userId),
    merchantId: new Types.ObjectId(merchantId),
  });

  if (!result) {
    throw new Error("Favorite merchant not found");
  }

  return { message: "Unfavorited successfully" };
};

export const FavoriteService = {
  addFavorite,
  getUserFavorites,
  removeFavorite,
};
