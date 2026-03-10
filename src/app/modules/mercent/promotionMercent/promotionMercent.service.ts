import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiErrors";
import QueryBuilder from "../../../../util/queryBuilder";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import { Rating } from "../../customer/rating/rating.model";
import { User } from "../../user/user.model";
import { Tier } from "../point&TierSystem/tier.model";
import { IPromotion } from "./promotionMercent.interface";
import { Promotion } from "./promotionMercent.model";
import { Sell } from "../mercentSellManagement/mercentSellManagement.model";
import { Types } from "mongoose";
import { sendNotification } from "../../../../helpers/notificationsHelper";
import { resolveCustomerIdsBySegment } from "../../../../util/customerSegmentation";
import { NotificationType } from "../../notification/notification.model";
import { CUSTOMER_SEGMENT } from "../../../../enums/user";
import { MerchantCustomer } from "../merchantCustomer/merchantCustomer.model";

const generatePromotionCode = (length = 6) => {
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CP-${code}`; // Prefix CP
};

const createPromotionToDB = async (
  payload: Partial<IPromotion>
): Promise<IPromotion> => {
  // Auto-generate cardId if not provided
  if (!payload.cardId) {
    payload.cardId = generatePromotionCode(6);
  }

  const promotion = new Promotion(payload);
  return promotion.save();
};

const updatePromotionToDB = async (
  id: string,
  payload: Partial<IPromotion>
): Promise<IPromotion | null> => {
  return Promotion.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const getAllPromotionsFromDB = async (
  query: any = {}
): Promise<{ promotions: IPromotion[]; pagination: any }> => {
  const queryBuilder = new QueryBuilder(
    Promotion.find({}).populate("merchantId", "website"),
    query
  );

  queryBuilder.search(["name"]).filter().sort().paginate().fields();

  const promotions = await queryBuilder.modelQuery;
  const pagination = await queryBuilder.getPaginationInfo();

  return { pagination, promotions };
};



const getAllPromotionsOfAMerchant = async (
  merchantId: string,
  query: any = {}
): Promise<{ promotions: IPromotion[]; pagination: any }> => {
  const queryBuilder = new QueryBuilder(
    Promotion.find({ merchantId }).populate("merchantId", "website"),
    query
  );

  queryBuilder.search(["name"]).filter().sort().paginate().fields();

  const promotions = await queryBuilder.modelQuery;
  const pagination = await queryBuilder.getPaginationInfo();

  return { pagination, promotions };
};


// Distance calculation function (Haversine)
const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};



const getUserSegment = async (userId: string) => {
  const purchases = await Sell.find({ userId, status: "completed" }).sort({ createdAt: -1 }).lean();

  const totalPurchases = purchases.length;
  const last6MonthsPurchases = purchases.filter(
    (p: any) => new Date(p.createdAt) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
  );

  const totalSpend = purchases.reduce((sum, p: any) => sum + p.totalBill, 0);

  const avgSpend = 10000;

  let segment: string;
  if (totalPurchases === 0 || (totalPurchases === 1 && purchases[0].createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) {
    segment = "new_customer";
  } else if (totalPurchases >= 2 && last6MonthsPurchases.length < 5) {
    segment = "returning_customer";
  } else if (last6MonthsPurchases.length >= 20 || totalSpend >= 3 * avgSpend) {
    segment = "vip_customer";
  }  else if (last6MonthsPurchases.length >= 5 || totalSpend >= 1.5 * avgSpend) {
    segment = "loyal_customer";
  }else {
    segment = "all_customer";
  }

  return segment; // ✅ শুধু string
};

// const getUserSegmentUpdate = async (userId: string, merchantId: string) => {
//   const customer = await MerchantCustomer.findOne({ userId, merchantId }).select("segment");
//   console.log("Customer segment from DB:", customer?.segment);
//   return customer?.segment || "new_customer"; // default
// };

const getSinglePromotionFromDB = async (
  id: string
): Promise<IPromotion | null> => {
  return Promotion.findById(id);
};

const deletePromotionFromDB = async (
  id: string
): Promise<IPromotion | null> => {
  return Promotion.findByIdAndDelete(id);
};

const togglePromotionInDB = async (id: string): Promise<IPromotion | null> => {
  const promotion = await Promotion.findById(id);
  if (!promotion) return null;

  // Toggle status
  promotion.status = promotion.status === "active" ? "inactive" : "active";

  return promotion.save();
};

const getPopularMerchantsFromDB = async () => {
  const result = await Rating.aggregate([
    {
      $group: {
        _id: "$merchantId",
        avgRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
    { $sort: { avgRating: -1, totalRatings: -1 } },
    { $limit: 20 },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },

    {
      $project: {
        _id: 1,
        avgRating: { $round: ["$avgRating", 2] },
        totalRatings: 1,

        // ✅ simple flat response
        firstName: "$merchant.firstName",
        email: "$merchant.email",
        profile: "$merchant.profile",
      },
    },
  ]);

  return result.length ? result : [];
};


const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const getDetailsOfMerchant = async (merchantId: string, userId?: string) => {
  console.log("========== API START: getDetailsOfMerchant ==========");
  console.log("merchantId:", merchantId);
  console.log("userId:", userId);

  // 1️⃣ Increment merchant visits
  await User.updateOne({ _id: merchantId }, { $inc: { totalVisits: 1 } });
  console.log("✔ Merchant visit count incremented");

  // 2️⃣ Load merchant
  const merchant: any = await User.findById(merchantId)
    .select("firstName businessName location profile photo about website address")
    .lean();

  if (!merchant) throw new ApiError(StatusCodes.NOT_FOUND, "Merchant not found");

  merchant.merchantName = merchant.businessName || merchant.firstName;
  merchant.availablePoints = 0;
  merchant.digitalCardId = ""; // default
  console.log(`✔ Merchant loaded: ${merchant.merchantName}`);

  let userSegment = "all_customer";
  let boughtPromotionIds: string[] = [];
  let userRatings: Record<string, number> = {};

  /* ================= USER CONTEXT ================= */
  if (userId) {
    const activeUser: any = await User.findById(userId).select("_id status").lean();
    console.log("User status:", activeUser?.status);

    if (activeUser?.status === "active") {
      userSegment = await getUserSegment(userId);
      console.log("✔ User segment:", userSegment);

      // 🔹 Fetch user's digital card for this merchant
      const digitalCard = await DigitalCard.findOne({ userId, merchantId }).lean();

      // ✅ Attach digitalCardId
      merchant.digitalCardId = digitalCard?._id.toString() || "";
      console.log("✔ User's digitalCardId:", merchant.digitalCardId);

      // 🔹 Bought promotion IDs
      boughtPromotionIds = digitalCard?.promotions
        .map((p) => p.promotionId?.toString())
        .filter((id): id is string => !!id) || [];
      console.log("✔ Bought promotion IDs from DigitalCard:", boughtPromotionIds);

      // 🔹 Fetch ratings for bought promotions
      const ratings = await Rating.find({
        merchantId,
        userId,
        promotionId: { $in: boughtPromotionIds },
      })
        .select("promotionId rating")
        .lean();

      ratings.forEach((r: any) => {
        if (r.promotionId) userRatings[r.promotionId.toString()] = r.rating;
      });
      console.log("✔ User ratings map:", userRatings);
    }
  }

  /* ================= PROMOTIONS ================= */
  const promotions = (await Promotion.find({ merchantId })
    .select("name discountPercentage startDate endDate image status availableDays customerSegment")
    .lean())
    .map((promo) => {
      const today = new Date();
      const todayDay = dayMap[today.getDay()];
      const promoId = promo._id.toString();

      const isBought = boughtPromotionIds.includes(promoId);

      const isValidDate = today >= new Date(promo.startDate) && today <= new Date(promo.endDate);
      const isValidDay = promo.availableDays?.includes("all") || promo.availableDays?.includes(todayDay);
      const isValid = promo.status === "active" && isValidDate && isValidDay;

      const segmentMatch =
        promo.customerSegment?.includes("all") || promo.customerSegment?.includes(userSegment);

      const shouldShow = isBought || (segmentMatch && isValid);

      if (!isBought && !segmentMatch) return null;

      return {
        ...promo,
        buy: isBought,
        show: shouldShow,
        rating: isBought ? userRatings[promoId] ?? 0 : 0,
      };
    })
    .filter(Boolean);

  console.log("✔ Total promotions found:", promotions.length);

  console.log("========== API END ==========");
  return { merchant, promotions };
};



const getUserTierOfMerchant = async (userId: string, merchantId: string) => {
  // 1. Get user's digital card
  const digitalCard = await DigitalCard.findOne({
    userId,
    merchantId,
  }).select("lifeTimeEarnPoints");

  // Use lifetimeEarnPoints
  const availablePoints = digitalCard?.lifeTimeEarnPoints ?? 0;

  // 2. Calculate total spent for this merchant
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

  // 3. Get merchant tiers
  const tiers = await Tier.find({ admin: merchantId }).sort({
    pointsThreshold: 1,
    minTotalSpend: 1,
  });

  if (!tiers.length) {
    return {
      availablePoints,  // lifetime points shown here
      totalSpend,
      tierName: "No tiers defined",
      rewardText: "N/A",
    };
  }

  // 4. Determine user's tier based on lifetime points and spend
  let userTier: any = null;

  for (const tier of tiers) {
    const meetsPoints = availablePoints >= tier.pointsThreshold;
    const meetsSpend = totalSpend >= tier.minTotalSpend;

    if (meetsPoints && meetsSpend) {
      userTier = tier; // keep highest eligible tier
    }
  }

  return {
    availablePoints,  // lifetime points
    totalSpend,
    tierName: userTier?.name ?? "No tier yet",
    rewardText: userTier?.reward ?? "No reward",
  };
};


//catagory based promotion fetching
const getPromotionsByUserCategory = async (categoryName: string, userId?: string) => {
  if (!categoryName) throw new Error("Category name is required");
  console.log("Category Name:", categoryName);

  // 1️⃣ Find merchants by category
  const normalizedCategory = categoryName.replace(/&/g, 'and').trim();
const merchants = await User.find(
  { service: { $regex: new RegExp(normalizedCategory, "i") } },
  { _id: 1 }
);
  console.log("Merchants found:", merchants.length);

  if (merchants.length === 0) return [];

  const merchantIds = merchants.map((m) => new Types.ObjectId(m._id));
  console.log("Merchant IDs:", merchantIds);

  // 2️⃣ Find all promotions from these merchants
  let promotions = await Promotion.find({ merchantId: { $in: merchantIds } })
    .select("cardId name discountPercentage startDate endDate image status availableDays customerSegment")
    .lean();
  console.log("Total Promotions found:", promotions.length);

  // 3️⃣ Today & day
  const today = new Date();
  const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayDay = dayMap[today.getDay()];
  console.log("Today:", today.toDateString(), "Day:", todayDay);

  if (userId) {
    // 4️⃣ Logged-in user
    const activeUser = await User.findById(userId).select("_id status");
    console.log("Active User:", activeUser);

    if (!activeUser || activeUser.status !== "active") {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not active");
    }

    // 5️⃣ User segment
    const userSegment = await getUserSegment(userId);
    console.log("User Segment:", userSegment);

    // 6️⃣ User's digital cards
    const digitalCards = await DigitalCard.find({ userId }).select("promotions");
    console.log("Digital Cards count:", digitalCards.length);

    const existingPromotionIds = digitalCards.flatMap(card =>
      card.promotions
        .filter((p: any) => p.promotionId)
        .map((p: any) => p.promotionId.toString()) as string[]
    );
    console.log("Existing Promotion IDs in user's cards:", existingPromotionIds);

    // 7️⃣ Filter promotions
    promotions = promotions.filter(promo => {
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);
      const days = promo.availableDays || [];

      const isValidDate = today >= startDate && today <= endDate;
      const isValidDay = days.includes("all") || days.includes(todayDay);
      const isNotInUserCard = !existingPromotionIds.includes(promo._id.toString());
      const isSegmentMatch = !promo.customerSegment || ["all_customer", userSegment].includes(promo.customerSegment);

      const includePromo = promo.status === "active" && isValidDate && isValidDay && isNotInUserCard && isSegmentMatch;
      console.log(`Promo: ${promo.name}, Active: ${promo.status}, ValidDate: ${isValidDate}, ValidDay: ${isValidDay}, NotInCard: ${isNotInUserCard}, SegmentMatch: ${isSegmentMatch}, Include: ${includePromo}`);

      return includePromo;
    });

  } else {
    // 8️⃣ Guest user
    promotions = promotions.filter(promo => {
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);
      const days = promo.availableDays || [];

      const isValidDate = today >= startDate && today <= endDate;
      const isValidDay = days.includes("all") || days.includes(todayDay);
      const isSegmentMatch = !promo.customerSegment || promo.customerSegment === "all_customer";

      const includePromo = promo.status === "active" && isValidDate && isValidDay && isSegmentMatch;
      console.log(`Guest Promo: ${promo.name}, Active: ${promo.status}, ValidDate: ${isValidDate}, ValidDay: ${isValidDay}, SegmentMatch: ${isSegmentMatch}, Include: ${includePromo}`);

      return includePromo;
    });
  }

  console.log("Filtered Promotions Count:", promotions.length);
  return promotions;
};


const sendNotificationToCustomer = async (
  payload: {
    message: string;
    attachment?: string;
    segment: CUSTOMER_SEGMENT;
    minPoints: number;
    radiusKm: number;

  },
  merchantId: Types.ObjectId
) => {

  const merchant = await User.findById(merchantId).select("location");
  if (!merchant) {
    throw new Error("Merchant not found");
  }
  if (!merchant?.location?.coordinates) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please update your location");
  }
  const lng = merchant?.location?.coordinates[0]
  const lat = merchant?.location?.coordinates[1]
  const merchantLocation = { lat, lng }

  const customers = await resolveCustomerIdsBySegment({
    merchantId,
    segment: payload.segment,
    minPoints: payload.minPoints,
    radiusKm: payload.radiusKm,
    merchantLocation,
  });

  if (!customers.length) return { sent: 0 };

  await sendNotification({
    userIds: customers.map(c => c._id),
    title: "Promotion Alert",
    body: payload.message,
    type: NotificationType.MANUAL,
    attachments: payload.attachment ? [payload.attachment] : [],
    channel: { socket: true, push: false },
  });

  return { sent: customers.length };
};





export const PromotionService = {
  createPromotionToDB,
  updatePromotionToDB,
  getAllPromotionsFromDB,
  getSinglePromotionFromDB,
  deletePromotionFromDB,
  togglePromotionInDB,
  getPopularMerchantsFromDB,
  getDetailsOfMerchant,
  getUserTierOfMerchant,
  getPromotionsByUserCategory,

  getUserSegment,
  getAllPromotionsOfAMerchant,
  sendNotificationToCustomer,
  // getUserSegmentUpdate,
};




