import mongoose, { Types } from "mongoose";
import { RecentViewedPromotion } from "./recentViewedPromotion.model";

const LIMIT = 10;

const addRecentViewedToDB = async (
  userId: mongoose.Types.ObjectId,
  promotionId: mongoose.Types.ObjectId
) => {
  const pId = new Types.ObjectId(promotionId);

  await RecentViewedPromotion.updateOne(
    { userId },
    { $pull: { items: pId } },
    { upsert: true }
  );

  const updated = await RecentViewedPromotion.findOneAndUpdate(
    { userId },
    {
      $push: {
        items: {
          $each: [pId],
          $position: 0,
        },
      },
    },
    { upsert: true, new: true }
  );

  if (updated.items.length > LIMIT) {
    updated.items = updated.items.slice(0, LIMIT);
    await updated.save();
  }

  return updated;
};

const getRecentViewedFromDB = async (userId: mongoose.Types.ObjectId) => {
  const record = await RecentViewedPromotion.findOne({ userId })
    .populate({
      path: "items",
      model: "PromotionMercent",
      select:
        "_id name customerSegment discountPercentage startDate endDate status merchantId image",
      populate: {
        path: "merchantId",
        model: "User",
        select: "website",
      },
    })
    .lean();

  return record?.items || [];
};

export const RecentViewedPromotionService = {
  addRecentViewedToDB,
  getRecentViewedFromDB,
};
