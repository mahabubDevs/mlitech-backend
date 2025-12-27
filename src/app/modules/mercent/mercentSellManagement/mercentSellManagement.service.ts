import { Types } from "mongoose";
import { Promotion } from "../../mercent/promotionMercent/promotionMercent.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import { Sell } from "./mercentSellManagement.model";
import { RequestApprovalOptions } from "./mercentSellManagement.interface";
import { NotificationType } from "../../notification/notification.model";
import { sendNotification } from "../../../../helpers/notificationsHelper";
import { Tier } from "../point&TierSystem/tier.model";
import { Rating } from "../../customer/rating/rating.model";

// -----------------------------
// 1. Merchant → Checkout
// -----------------------------
// const checkout = async (
//   merchantId: string,
//   digitalCardCode: string,
//   totalBill: number,
//   promotionId?: string,
//   pointRedeemed: number = 0
// ) => {
//   const POINT_EARN_RATE = 100; // 100 currency = 1 point
//   const POINT_REDEEM_RATE = 1; // 1 point = 1 currency

//   // 1️⃣ Find Digital Card
//   const digitalCard = await DigitalCard.findOne({
//     merchantId: new Types.ObjectId(merchantId),
//     cardCode: digitalCardCode,
//   });

//   if (!digitalCard) {
//     throw new Error("Digital Card not found for this merchant");
//   }

//   console.log("💠 Digital Card Found:", digitalCard._id.toString());

//   let discount = 0;
//   let selectedPromotion: any = null;

//   // 2️⃣ Handle Promotion
//   if (promotionId) {
//     selectedPromotion = await Promotion.findById(promotionId);

//     if (!selectedPromotion) {
//       throw new Error("Promotion not found");
//     }

//     const promoIndex = digitalCard.promotions.findIndex(
//       (p) => p.promotionId?.toString() === promotionId
//     );

//     if (promoIndex === -1) {
//       throw new Error("Promotion not added to this DigitalCard");
//     }

//     const promo = digitalCard.promotions[promoIndex];

//     if (promo.status === "unused") {
//       promo.status = "used";
//       promo.usedAt = new Date();
//       discount = selectedPromotion.discountPercentage || 0;
//     } else if (promo.status === "pending") {
//       throw new Error("User approval needed for this promotion");
//     } else {
//       throw new Error("Promotion already used or expired");
//     }

//     await digitalCard.save();
//   }

//   // 3️⃣ Discounted bill
//   const discountedBill = parseFloat(
//     (totalBill - (totalBill * discount) / 100).toFixed(4)
//   );

//   // 4️⃣ Point discount
//   const pointDiscount = parseFloat(
//     (pointRedeemed * POINT_REDEEM_RATE).toFixed(4)
//   );

//   // 5️⃣ Final bill
//   const finalBill = parseFloat(
//     (discountedBill - pointDiscount).toFixed(4)
//   );

//   // 6️⃣ Earn points (based on discounted bill)
//   const pointsEarned = parseFloat(
//     (discountedBill / POINT_EARN_RATE).toFixed(4)
//   );

//   // 7️⃣ Validation: enough points to redeem
//   if (pointRedeemed > (digitalCard.availablePoints || 0)) {
//     throw new Error("Not enough available points");
//   }

//   // 8️⃣ Update points
//   digitalCard.availablePoints = parseFloat(
//     (
//       (digitalCard.availablePoints || 0) +
//       pointsEarned -
//       pointRedeemed
//     ).toFixed(4)
//   );

//   // 🔥 Lifetime points ONLY increase
//   digitalCard.lifeTimeEarnPoints = parseFloat(
//     (
//       (digitalCard.lifeTimeEarnPoints || 0) +
//       pointsEarned
//     ).toFixed(4)
//   );

//   await digitalCard.save();

//   console.log("💠 Available Points:", digitalCard.availablePoints);
//   console.log("💠 Lifetime Earned Points:", digitalCard.lifeTimeEarnPoints);

//   // 9️⃣ Save transaction
//   const sell = await Sell.create({
//     merchantId,
//     userId: digitalCard.userId,
//     digitalCardId: digitalCard._id,
//     promotionId: selectedPromotion?._id || null,
//     totalBill,
//     discountedBill,
//     pointRedeemed,
//     pointDiscount,
//     finalBill,
//     pointsEarned,
//     status: "completed",
//   });

//   // 🔔 Notifications
//   if (pointRedeemed > 0) {
//     await sendNotification({
//       userIds: [merchantId],
//       title: "Point Redeemed",
//       body: `${pointRedeemed} points redeemed successfully`,
//       type: NotificationType.POINTS,
//     });
//   }

//   if (pointsEarned > 0) {
//     await sendNotification({
//       userIds: [digitalCard.userId],
//       title: "Point Earned",
//       body: `${pointsEarned} points earned successfully`,
//       type: NotificationType.POINTS,
//     });
//   }

//   return sell;
// };

// Revised checkout function
// ... আগের imports

 const checkout = async (
  merchantId: string,
  digitalCardCode: string,
  totalBill: number,
  promotionId?: string,
  pointRedeemed: number = 0
) => {
  const POINT_EARN_RATE = 100;
  const POINT_REDEEM_RATE = 1;

  // 1️⃣ Find Digital Card
  const digitalCard = await DigitalCard.findOne({
    merchantId: new Types.ObjectId(merchantId),
    cardCode: digitalCardCode,
  });
  if (!digitalCard) throw new Error("Digital Card not found");

  console.log("💠 Digital Card Found:", digitalCard._id.toString());
  console.log("💠 Available Points Before:", digitalCard.availablePoints);
  console.log("💠 Lifetime Points Before:", digitalCard.lifeTimeEarnPoints);
  console.log("💠 Current Tier:", digitalCard.tier);

  let discount = 0;
  let selectedPromotion: any = null;

  // 2️⃣ Handle Promotion
  if (promotionId) {
    selectedPromotion = await Promotion.findById(promotionId);
    if (!selectedPromotion) throw new Error("Promotion not found");

    const promoIndex = digitalCard.promotions.findIndex(
      (p) => p.promotionId?.toString() === promotionId
    );
    if (promoIndex === -1) throw new Error("Promotion not added to this DigitalCard");

    const promo = digitalCard.promotions[promoIndex];
    
    if (promo.status === "pending") {
      throw new Error("User approval needed for this promotion");
    }

    if (promo.status === "unused") {
      promo.status = "used";
      promo.usedAt = new Date();
      discount = selectedPromotion.discountPercentage || 0;
      console.log(`💠 Promotion Applied: ${discount}%`);
    } else {
      console.log("⚠️ Promotion cannot be applied:", promo.status);
    }
    await digitalCard.save();
  }

  // 3️⃣ Discounted bill
  const discountedBill = parseFloat((totalBill - (totalBill * discount) / 100).toFixed(4));
  console.log("💠 Discounted Bill:", discountedBill);

  // 4️⃣ Fetch Tiers
  const tiers = await Tier.find({ admin: merchantId, isActive: true }).sort({ pointsThreshold: 1 });

  // 5️⃣ Determine current tier
  const applicableTier = tiers.filter(t => t.pointsThreshold <= (digitalCard.lifeTimeEarnPoints || 0)).pop();
  const redeemMultiplier = applicableTier?.redemptionRule || 1;
  const earnMultiplier = applicableTier?.accumulationRule || 1;

  console.log("💠 Applicable Tier:", applicableTier?.name || "None");
  console.log("💠 Redeem Multiplier:", redeemMultiplier);
  console.log("💠 Earn Multiplier:", earnMultiplier);

  // 6️⃣ Validate redeem points
  if (pointRedeemed > (digitalCard.availablePoints || 0)) {
    throw new Error("Not enough available points");
  }

  // 7️⃣ Point discount & points earned
  const pointDiscount = parseFloat((pointRedeemed * POINT_REDEEM_RATE * redeemMultiplier).toFixed(4));
  const pointsEarned = parseFloat(((discountedBill / POINT_EARN_RATE) * earnMultiplier).toFixed(4));

  console.log("💠 Points Redeemed:", pointRedeemed);
  console.log("💠 Point Discount:", pointDiscount);
  console.log("💠 Points Earned:", pointsEarned);

  // 8️⃣ Update digital card
  digitalCard.availablePoints = parseFloat(
    ((digitalCard.availablePoints || 0) + pointsEarned - pointRedeemed).toFixed(4)
  );
  digitalCard.lifeTimeEarnPoints = parseFloat(
    ((digitalCard.lifeTimeEarnPoints || 0) + pointsEarned).toFixed(4)
  );

  // 9️⃣ Tier upgrade
  const newTier = tiers.filter(t => t.pointsThreshold <= digitalCard.lifeTimeEarnPoints).pop();
  if (newTier && newTier.name !== digitalCard.tier) {
    console.log(`🎉 Tier Upgraded from ${digitalCard.tier || "None"} to ${newTier.name}`);
    digitalCard.tier = newTier.name;

    if (newTier.reward) {
      const rewardPoints = parseFloat(newTier.reward);
      digitalCard.availablePoints += rewardPoints;
      digitalCard.lifeTimeEarnPoints += rewardPoints;
      console.log(`💠 Tier Reward Points Added: ${rewardPoints}`);
    }
  }

  await digitalCard.save();
  console.log("💠 Available Points After:", digitalCard.availablePoints);
  console.log("💠 Lifetime Points After:", digitalCard.lifeTimeEarnPoints);
  console.log("💠 Current Tier After:", digitalCard.tier);

  // 10️⃣ Final bill
  const finalBill = parseFloat((discountedBill - pointDiscount).toFixed(4));
  console.log("💠 Final Bill to Pay:", finalBill);

  // 11️⃣ Save transaction
  const sell = await Sell.create({
    merchantId,
    userId: digitalCard.userId,
    digitalCardId: digitalCard._id,
    promotionId: selectedPromotion?._id || null,
    totalBill,
    discountedBill,
    pointRedeemed,
    pointDiscount,
    finalBill,
    pointsEarned,
    status: "completed",
  });
  console.log("💠 Transaction Saved ID:", sell._id.toString());

  return sell;
};

// -----------------------------





const requestApproval = async ({
  merchantId,
  digitalCardCode,
  promotionId = null,
  totalBill = 0,
  pointRedeemed = 0,
}: RequestApprovalOptions) => {
  const POINT_EARN_RATE = 100;
  const POINT_REDEEM_RATE = 1;

  let digitalCard: any = null;

  // 1️⃣ If promotionId is given, find promotion first
  if (promotionId) {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) throw new Error("Promotion not found");

    // Find DigitalCard which has this promotion
    digitalCard = await DigitalCard.findOne({
      merchantId,
      "promotions.promotionId": promotion._id,
      "promotions.status": { $in: ["pending", "unused"] },
      "promotions.usedAt": null,
    });

    if (!digitalCard) throw new Error("Digital Card containing this promotion not found");

  } else if (digitalCardCode) {
    // 2️⃣ Otherwise, search by digitalCardCode
    digitalCard = await DigitalCard.findOne({
      merchantId,
      cardCode: digitalCardCode,
    });

    if (!digitalCard) throw new Error("Digital Card not found for this merchant");
  } else {
    throw new Error("digitalCardCode or promotionId is required");
  }

  let discount = 0;

  if (promotionId) {
    const promo = digitalCard.promotions.find(
      (p: { promotionId?: Types.ObjectId; status?: string; usedAt?: Date }) => p.promotionId?.toString() === promotionId
    );

    if (!promo) throw new Error("Promotion not found in digital card");

    if (promo.status !== "pending") throw new Error("Promotion does not require approval");

    const selectedPromotion = await Promotion.findById(promotionId);
    discount = selectedPromotion?.discountPercentage || 0;
  }

  const discountedBill = totalBill - (totalBill * discount) / 100;
  const pointDiscount = pointRedeemed * POINT_REDEEM_RATE;
  const finalBill = discountedBill - pointDiscount;
  const pointsEarned = totalBill / POINT_EARN_RATE;

  const formattedData = {
    merchantId,
    userId: digitalCard.userId,
    digitalCard: digitalCard._id,
    digitalCardCode: digitalCard.cardCode,
    promotionId,
    totalBill: parseFloat(totalBill.toFixed(4)),
    discountedBill,
    pointRedeemed: parseFloat(pointRedeemed.toFixed(4)),
    pointDiscount,
    finalBill: parseFloat(finalBill.toFixed(4)),
    pointsEarned,
  };

  // Emit via socket if needed
  const io = (global as any).io;
  if (io) {
    io.emit(`getApplyRequest::${digitalCard.userId}`, formattedData);
  }

  return formattedData;
};



// -----------------------------
const getPendingRequests = async (userId: string) => {
  const cards = await DigitalCard.find({
    userId: new Types.ObjectId(userId),
    "promotions.status": "pending",
  });

  interface PendingRequest {
    digitalCardId: Types.ObjectId;
    promotionId: Types.ObjectId | undefined | null;
    cardCode: string;
  }

  const requests: PendingRequest[] = [];
  cards.forEach((card) => {
    card.promotions.forEach((p) => {
      if (p.status === "pending") {
        requests.push({
          digitalCardId: card._id,
          promotionId: p.promotionId,
          cardCode: card.cardCode,
        });
      }
    });
  });

  return requests;
};
// -----------------------------
// 3. User → Approve Promotion
// -----------------------------
const approvePromotion = async (
  digitalCardCode: string,
  promotionId: string,
  userId: string
) => {
  const digitalCard = await DigitalCard.findOne({
    cardCode: digitalCardCode,
    userId: new Types.ObjectId(userId),
  });

  if (!digitalCard) {
    throw new Error("Digital card not found for user");
  }

  const promo = digitalCard.promotions.find(
    (p) => p.promotionId?.toString() === promotionId
  );

  if (!promo) {
    throw new Error("Promotion not found in card");
  }

  if (promo.status !== "pending") {
    throw new Error("Promotion already approved or used");
  }

  // Approval done
  promo.status = "unused";

  await digitalCard.save();

  return { status: "approved" };
};

const approvePromotionReject = async (
  digitalCardCode: string,
  promotionId: string,
  userId: string
) => {
  const digitalCard = await DigitalCard.findOne({
    cardCode: digitalCardCode,
    userId: new Types.ObjectId(userId),
  });

  if (!digitalCard) {
    throw new Error("Digital card not found for user");
  }

  const promo = digitalCard.promotions.find(
    (p) => p.promotionId?.toString() === promotionId
  );

  if (!promo) {
    throw new Error("Promotion not found in card");
  }

  if (promo.status !== "pending") {
    throw new Error("Promotion already approved or used");
  }

  // Approval done
  promo.status = "pending";

  await digitalCard.save();

  return { status: "reject" };
};

// Service
const getPointsHistory = async (
  digitalCardId: string,
  type: "all" | "earn" | "use" = "all"
) => {
  try {
    if (!Types.ObjectId.isValid(digitalCardId)) {
      throw new Error("Invalid digitalCardId");
    }

    const typeSanitized = type?.trim().toLowerCase() as
      | "all"
      | "earn"
      | "use";

    const query: any = {
      digitalCardId: new Types.ObjectId(digitalCardId),
    };

    if (typeSanitized === "earn") query.pointsEarned = { $gt: 0 };
    if (typeSanitized === "use") query.pointRedeemed = { $gt: 0 };

    const history = await Sell.find(query)
      .sort({ createdAt: -1 })
      .populate("merchantId", "businessName shopName firstName")
      .lean();

    const result: any[] = [];

    for (const tx of history) {
      const merchant = tx.merchantId as
        | { _id?: Types.ObjectId; businessName?: string; shopName?: string; firstName?: string }
        | undefined;

      const merchantName =
        merchant?.businessName ||
        merchant?.shopName ||
        merchant?.firstName ||
        "";

      // 🔎 find rating for this transaction
      const ratingDoc = await Rating.findOne({
        merchantId: merchant?._id,
        promotionId: tx.promotionId,
        digitalCardId: tx.digitalCardId,
        userId: tx.userId,
      })
        .select("rating comment")
        .lean();

      const ratingInfo = ratingDoc
        ? {
            rating: ratingDoc.rating,
            comment: ratingDoc.comment,
          }
        : null;

      // 🎯 Earn points
      if (
        (typeSanitized === "all" || typeSanitized === "earn") &&
        (tx.pointsEarned ?? 0) > 0
      ) {
        result.push({
          id: tx._id,
          digitalCardId: tx.digitalCardId,
          type: "earn",
          points: tx.pointsEarned ?? 0,
          totalBill: tx.totalBill,
          discountedBill: tx.discountedBill,
          date: tx.createdAt,
          promotionId: tx.promotionId,
          merchant: merchantName,
          merchantId: merchant?._id,
          // rating: ratingInfo, // ✅ added
        });
      }

      // 🎯 Used points
      if (
        (typeSanitized === "all" || typeSanitized === "use") &&
        (tx.pointRedeemed ?? 0) > 0
      ) {
        result.push({
          id: tx._id,
          digitalCardId: tx.digitalCardId,
          type: "use",
          points: tx.pointRedeemed ?? 0,
          totalBill: tx.totalBill,
          discountedBill: tx.discountedBill,
          date: tx.createdAt,
          promotionId: tx.promotionId,
          merchant: merchantName,
          merchantId: merchant?._id,
          // rating: ratingInfo, // ✅ added
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Error in getPointsHistory:", error);
    throw error;
  }
};


interface ITransactionPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const getUserFullTransactions = async (
  userId: string,
  type: "all" | "earn" | "use" = "all",
  page = 1,
  limit = 20
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const skip = (page - 1) * limit;

  const query: any = { userId: new Types.ObjectId(userId) };
  if (type === "earn") query.pointsEarned = { $gt: 0 };
  if (type === "use") query.pointRedeemed = { $gt: 0 };

  const [total, transactions] = await Promise.all([
    Sell.countDocuments(query),
    Sell.find(query)
      .populate("merchantId", "name businessName shopName")
      .populate("userId", "firstName lastName email phone profile customUserId country")
      .populate("digitalCardId", "cardCode availablePoints")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const pagination: ITransactionPagination = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return { transactions, pagination };
};

// -----------------------------
// EXPORT SERVICE
// -----------------------------
export const SellService = {
  checkout,
  requestApproval,
  getPendingRequests,
  approvePromotion,
  approvePromotionReject,
  getPointsHistory,
  getUserFullTransactions
};
