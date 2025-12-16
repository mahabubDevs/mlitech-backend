import mongoose from "mongoose";

import { User } from "../../user/user.model";
import QueryBuilder from "../../../../util/queryBuilder";
import { Promotion } from "../promotionMercent/promotionMercent.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";

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

export const MemberService = {
  getAllMembers,
  getSingleMember,
};
