import mongoose, { Types } from "mongoose";

import { User } from "../../user/user.model";
import QueryBuilder from "../../../../util/queryBuilder";
import { Promotion } from "../promotionMercent/promotionMercent.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import ApiError from "../../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { Sell } from "../mercentSellManagement/mercentSellManagement.model";
import { Tier } from "../point&TierSystem/tier.model";

const getAllMembers = async (
  merchantId: string,
  query: Record<string, any>
) => {
  // 1️⃣ Get unique buyer IDs from DigitalCard (correct source)
  const buyerIds = await DigitalCard.distinct("userId", {
    merchantId: new mongoose.Types.ObjectId(merchantId),
  });

  if (!buyerIds.length) {
    return {
      members: [],
      pagination: {
        total: 0,
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
        pages: 0,
      },
    };
  }

  // 2️⃣ Query Builder for members
  const qb = new QueryBuilder(
    User.find({ _id: { $in: buyerIds } }).select("firstName location status "),
    query
  )
    .search(["firstName", "lastName", "email", "phone"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const members = await qb.modelQuery.lean();
  const pagination = await qb.getPaginationInfo();

  // 3️⃣ Get digital cards for these users under this merchant
  const digitalCards = await DigitalCard.find({
    userId: { $in: buyerIds },
    merchantId,
  })
    .select("cardCode availablePoints promotions")
    .lean();

  // 4️⃣ Attach cards to each member
  const membersWithCards = members.map((member) => ({
    ...member,
    digitalCards: digitalCards.filter(
      (dc) =>
        (dc.userId && dc.userId.toString()) === (member._id as any).toString()
    ),
  }));

  return {
    members: membersWithCards,
    pagination,
  };
};

const getSingleMember = async (merchantId: string, userId: string) => {
  // Check if user bought gift card from merchant
  const bought = await Promotion.findOne({
    merchantId: new mongoose.Types.ObjectId(merchantId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!bought) return null;

  const member = await User.findById(userId)
    .select("firstName lastName email phone")
    .lean();

  const digitalCards = await DigitalCard.find({ userId, merchantId })
    .select("uniqueId totalPoints expiry")
    .lean();

  return {
    ...member,
    digitalCards,
  };
};


const getSingleMemberTier = async (merchantId: string, userId: string) => {
  // 1️⃣ Get user's digital card (points)
  const digitalCard = await DigitalCard.findOne({
    userId,
    merchantId,
  }).select("availablePoints lifeTimeEarnPoints"); // lifetime points ও নেওয়া

  if (!digitalCard) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "User has no digital card with this merchant"
    );
  }

  const availablePoints = digitalCard.availablePoints ?? 0; // current points
  const lifetimePoints = digitalCard.lifeTimeEarnPoints ?? 0; // lifetime points for tier

  // 2️⃣ Calculate total spent for this merchant
  const spendAgg = await Sell.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        merchantId: new Types.ObjectId(merchantId),
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        totalSpend: { $sum: "$totalBill" },
      },
    },
  ]);

  const totalSpend = spendAgg.length ? spendAgg[0].totalSpend : 0;

  // 3️⃣ Get merchant tiers
  const tiers = await Tier.find({ admin: merchantId }).sort({
    pointsThreshold: 1, // pointsThreshold = lifetime points needed
    minTotalSpend: 1,
  });

  if (!tiers.length) {
    return {
      availablePoints,
      lifetimePoints,
      tierName: "No tier Found",
    };
  }

  // 4️⃣ Determine user's tier based on lifetime points
  let userTier: any = null;

  for (const tier of tiers) {
    const meetsPoints = lifetimePoints >= tier.pointsThreshold; // lifetime points check
    const meetsSpend = totalSpend >= tier.minTotalSpend;

    if (meetsPoints && meetsSpend) {
      userTier = tier; // keep looping to get the highest eligible tier
    }
  }

  return {
    availablePoints,       // current points
    lifetimePoints,        // lifetime points
    tierName: userTier?.name ?? "No tier Found",
  };
};

export const MemberService = {
  getAllMembers,
  getSingleMember,
  getSingleMemberTier,
};
