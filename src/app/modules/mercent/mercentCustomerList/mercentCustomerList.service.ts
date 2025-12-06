import mongoose from "mongoose";
import { GiftCard } from "../../giftCard/giftCard.model";

import { User } from "../../user/user.model";
import QueryBuilder from "../../../../util/queryBuilder";
import { DigitalCard } from "../../giftCard/digitalCard.model";

const getAllMembers = async (merchantId: string, query: Record<string, any>) => {
  // 1️⃣ Get unique buyer IDs from GiftCard
  const buyerIds = await GiftCard.distinct("userId", {
    merchantId: new mongoose.Types.ObjectId(merchantId),
    userId: { $ne: null },
  });

  if (!buyerIds.length) {
    return {
      members: [],
      pagination: { total: 0, page: query.page || 1, limit: query.limit || 20, pages: 0 },
    };
  }

  // 2️⃣ Build QueryBuilder for users
  const qb = new QueryBuilder(
    User.find({ _id: { $in: buyerIds } }),
    query
  )
    .search(["firstName", "lastName", "email", "phone"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const members = await qb.modelQuery.lean();
  const pagination = await qb.getPaginationInfo();

  // 3️⃣ Include DigitalCard info
  const digitalCards = await DigitalCard.find({ userId: { $in: buyerIds }, merchantId })
    .select("uniqueId totalPoints expiry")
    .lean();

  const membersWithCards = members.map(member => ({
    ...member,
    digitalCards: digitalCards.filter(dc => dc.userId.toString() === (member._id as string).toString()),
  }));

  return {
    members: membersWithCards,
    pagination,
  };
};

const getSingleMember = async (merchantId: string, userId: string) => {
  // Check if user bought gift card from merchant
  const bought = await GiftCard.findOne({
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

export const MemberService = {
  getAllMembers,
  getSingleMember,
};
