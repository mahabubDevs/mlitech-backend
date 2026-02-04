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



const checkout = async (
  merchantId: string,
  digitalCardCode: string,
  totalBill: number,
  promotionIds: string[] = [],
  pointRedeemed: number = 0
) => {
  const POINT_EARN_RATE = 10;
  const POINT_REDEEM_RATE = 10;

  // ===============================
  // 🔍 Find Digital Card
  // ===============================
  const digitalCard = await DigitalCard.findOne({
    merchantId,
    cardCode: digitalCardCode,
  });

  if (!digitalCard) {
    throw new Error("Digital Card not found");
  }

  // ===============================
// 🎯 Promotion Validation
// ===============================
let totalGrossValue = 0;
let totalDiscount = 0;

for (const promoId of promotionIds) {
  const promoInCard = digitalCard.promotions.find(
    (p: any) => p.promotionId?.toString() === promoId
  );

  if (!promoInCard) {
    throw new Error(`Promotion ${promoId} not found in digital card`);
  }

  // ✅ FIXED STATUS CHECK
  if (promoInCard.status === "used") {
    throw new Error(`Promotion ${promoId} already used`);
  }

  const promotion = await Promotion.findById(promoId);
  if (!promotion) {
    throw new Error(`Promotion ${promoId} not found`);
  }

  const grossValue = promotion.grossValue || 0;
  const discountPercentage = promotion.discountPercentage || 0;
  const discountAmount = (grossValue * discountPercentage) / 100;

  totalGrossValue += grossValue;
  totalDiscount += discountAmount;

  // ✅ ONLY HERE promotion is marked as used
  promoInCard.status = "used";
  promoInCard.usedAt = new Date();
}

await digitalCard.save();

  // ===============================
  // 💰 Bill Calculation
  // ===============================
  const discountedBill = parseFloat(
    (totalBill - totalDiscount).toFixed(4)
  );

  const pointDiscount = parseFloat(
    (pointRedeemed * POINT_REDEEM_RATE).toFixed(4)
  );

  const finalBill = parseFloat(
    (discountedBill - pointDiscount).toFixed(4)
  );

  // ===============================
  // ⭐ Tier & Earn Point Calculation
  // ===============================
  const netBillForPoint = Math.max(
    totalBill - totalGrossValue,
    0
  );

  const userTier = await Tier.findOne({
    admin: merchantId,
    isActive: true,
    pointsThreshold: { $lte: digitalCard.lifeTimeEarnPoints || 0 },
  }).sort({ pointsThreshold: -1 });

  const accumulationPercentage =
    userTier?.accumulationRule || 0;

  const eligibleAmount =
    (netBillForPoint * accumulationPercentage) / 100;

  const pointsEarned = parseFloat(
    (eligibleAmount / POINT_EARN_RATE).toFixed(4)
  );

  // ===============================
  // 🔄 Update Digital Card
  // ===============================
  if (pointRedeemed > digitalCard.availablePoints) {
    throw new Error("Not enough available points");
  }

  digitalCard.availablePoints = parseFloat(
    (
      digitalCard.availablePoints +
      pointsEarned -
      pointRedeemed
    ).toFixed(4)
  );

  digitalCard.lifeTimeEarnPoints = parseFloat(
    (
      digitalCard.lifeTimeEarnPoints +
      pointsEarned
    ).toFixed(4)
  );

  await digitalCard.save();

  // ===============================
  // 🧾 Save Transaction
  // ===============================
  const sell = await Sell.create({
    merchantId,
    userId: digitalCard.userId,
    digitalCardId: digitalCard._id,
    promotionIds,
    totalBill,
    totalGrossValue,
    totalDiscount,
    discountedBill,
    pointRedeemed,
    pointDiscount,
    finalBill,
    pointsEarned,
    status: "completed",
  });

  // ===============================
  // 🔔 Notifications
  // ===============================
  if (pointsEarned > 0) {
    await sendNotification({
      userIds: [digitalCard.userId.toString()],
      title: "Points Earned",
      body: `You earned ${pointsEarned} points`,
      type: NotificationType.POINTS,
    });
  }

  if (pointRedeemed > 0) {
    await sendNotification({
      userIds: [digitalCard.userId.toString()],
      title: "Points Redeemed",
      body: `You redeemed ${pointRedeemed} points`,
      type: NotificationType.POINTS,
    });
  }

  return sell;
};


// -----------------------------





// const requestApproval = async ({
//   merchantId,
//   digitalCardCode, // এখন এটা cardCode বা promoCode দুটাই হতে পারে
//   promotionId = null,
//   totalBill = 0,
//   pointRedeemed = 0,
// }: RequestApprovalOptions) => {
//   const POINT_EARN_RATE = 10;
//   const POINT_REDEEM_RATE = 10;

//   let digitalCard: any = null;
//   let appliedPromotionId: string | null = promotionId;

//   console.log("🟢 requestApproval called with:", {
//     merchantId,
//     digitalCardCode,
//     promotionId,
//     totalBill,
//     pointRedeemed,
//   });

//   // 🔍 CASE 1: promoCode দিয়ে search (PC-xxxx)
//   if (digitalCardCode?.startsWith("PC-")) {
//     console.log("🔹 Searching by promoCode:", digitalCardCode);

//     digitalCard = await DigitalCard.findOne({
//       merchantId,
//       "promotions.promoCode": digitalCardCode,
//       "promotions.status": { $in: ["pending", "unused"] },
//       "promotions.usedAt": null,
//     });

//     if (!digitalCard) {
//       throw new Error("Digital Card not found using promo code");
//     }

//     // promoCode থেকে promotionId বের করা
//     const promo = digitalCard.promotions.find(
//       (p: any) => p.promoCode === digitalCardCode
//     );

//     if (!promo) throw new Error("Promotion not found inside digital card");

//     appliedPromotionId = promo.promotionId.toString();

//     console.log("✅ Digital card found by promoCode:", digitalCard._id.toString());
//   }

//   // 🔍 CASE 2: cardCode দিয়ে search (DG-xxxx)
//   else if (digitalCardCode?.startsWith("DG-")) {
//     console.log("🔹 Searching by digital cardCode:", digitalCardCode);

//     digitalCard = await DigitalCard.findOne({
//       merchantId,
//       cardCode: digitalCardCode,
//     });

//     if (!digitalCard) {
//       throw new Error("Digital Card not found for this merchant");
//     }

//     console.log("✅ Digital card found by cardCode:", digitalCard._id.toString());
//   }

//   else {
//     throw new Error("Invalid digitalCardCode provided");
//   }

//   // 🎯 Promotion validation & discount
//   let discount = 0;

//   if (appliedPromotionId) {
//     const promoInCard = digitalCard.promotions.find(
//       (p: any) => p.promotionId?.toString() === appliedPromotionId
//     );

//     if (!promoInCard) throw new Error("Promotion not found in digital card");
//     if (!["pending", "unused"].includes(promoInCard.status)) {
//       throw new Error("Promotion does not require approval");
//     }

//     const promotion = await Promotion.findById(appliedPromotionId);
//     if (!promotion) throw new Error("Promotion not found");

//     discount = promotion.discountPercentage || 0;
//     console.log("🔹 Discount percentage:", discount);
//   }

//   // 💰 Bill calculation
//   const discountedBill = parseFloat(
//     (totalBill - (totalBill * discount) / 100).toFixed(4)
//   );
//   const pointDiscount = parseFloat(
//     (pointRedeemed * POINT_REDEEM_RATE).toFixed(4)
//   );
//   const finalBill = parseFloat((discountedBill - pointDiscount).toFixed(4));
//   const pointsEarned = parseFloat((finalBill / POINT_EARN_RATE).toFixed(4));

//   console.log("💰 Billing calculation:", {
//     totalBill,
//     discountedBill,
//     pointRedeemed,
//     pointDiscount,
//     finalBill,
//     pointsEarned,
//   });

//   const formattedData = {
//     merchantId,
//     userId: digitalCard.userId,
//     digitalCard: digitalCard._id,
//     digitalCardCode: digitalCard.cardCode,
//     promotionId: appliedPromotionId,
//     totalBill: parseFloat(totalBill.toFixed(4)),
//     discountedBill,
//     pointRedeemed: parseFloat(pointRedeemed.toFixed(4)),
//     pointDiscount,
//     finalBill,
//     pointsEarned,
//   };

//   // 📡 Socket emit
//   // const io = (global as any).io;
//   // if (io && (pointRedeemed > 0 || appliedPromotionId)) {
//   //   io.emit(`getApplyRequest::${digitalCard.userId}`, formattedData);
//   //   console.log("💠 Approval request sent via socket");
//   // }

//   console.log("✅ requestApproval result prepared:", formattedData);
//   return formattedData;
// };


const requestApproval = async ({
  merchantId,
  digitalCardCode, // DG-xxxx or PC-xxxx
  promotionId = null, // string | string[]
  totalBill = 0,
  pointRedeemed = 0,
}: RequestApprovalOptions) => {
  const POINT_EARN_RATE = 10;    // 10 taka = 1 point
  const POINT_REDEEM_RATE = 10;  // 1 point = 10 taka

  let digitalCard: any = null;

  // 🔹 Normalize promotionId to array
  let appliedPromotionIds: string[] = [];
  if (promotionId) {
    appliedPromotionIds = Array.isArray(promotionId)
      ? promotionId
      : [promotionId];
  }

  console.log("🟢 requestApproval called with:", {
    merchantId,
    digitalCardCode,
    appliedPromotionIds,
    totalBill,
    pointRedeemed,
  });

  // ===============================
  // 🔍 Find Digital Card
  // ===============================

  // CASE 1: promoCode (PC-xxxx)
  if (digitalCardCode?.startsWith("PC-")) {
    digitalCard = await DigitalCard.findOne({
      merchantId,
      "promotions.promoCode": digitalCardCode,
      "promotions.status": { $in: ["pending", "unused"] },
      "promotions.usedAt": null,
    });

    if (!digitalCard) throw new Error("Digital card not found by promo code");

    const promo = digitalCard.promotions.find(
      (p: any) => p.promoCode === digitalCardCode
    );
    if (!promo) throw new Error("Promotion not found in digital card");

    appliedPromotionIds = [promo.promotionId.toString()];
  }

  // CASE 2: digital cardCode (DG-xxxx)
  else if (digitalCardCode?.startsWith("DG-")) {
    digitalCard = await DigitalCard.findOne({
      merchantId,
      cardCode: digitalCardCode,
    });

    if (!digitalCard) throw new Error("Digital card not found by card code");
  }

  else {
    throw new Error("Invalid digitalCardCode");
  }

  // ===============================
  // 🎯 Promotion Validation & Discount
  // ===============================

  let totalDiscount = 0;
  let totalGrossValue = 0;

  const promotionsDetail: {
    promotionId: string;
    grossValue: number;
    discountPercentage: number;
    discountAmount: number;
  }[] = [];

  for (const promoId of appliedPromotionIds) {
    const promoInCard = digitalCard.promotions.find(
      (p: any) => p.promotionId?.toString() === promoId
    );

    if (!promoInCard) {
      throw new Error(`Promotion ${promoId} not found in digital card`);
    }

    if (!["pending", "unused"].includes(promoInCard.status)) {
      throw new Error(`Promotion ${promoId} already used`);
    }

    const promotion = await Promotion.findById(promoId);
    if (!promotion) throw new Error(`Promotion ${promoId} not found`);

    const grossValue = promotion.grossValue || 0;
    const discountPercentage = promotion.discountPercentage || 0;

    const discountAmount = (grossValue * discountPercentage) / 100;

    totalGrossValue += grossValue;
    totalDiscount += discountAmount;

    promotionsDetail.push({
      promotionId: promoId,
      grossValue,
      discountPercentage,
      discountAmount,
    });
  }

  // ===============================
  // 💰 Bill Calculation
  // ===============================

  const discountedBill = parseFloat(
    (totalBill - totalDiscount).toFixed(4)
  );

  const pointDiscount = parseFloat(
    (pointRedeemed * POINT_REDEEM_RATE).toFixed(4)
  );

  const finalBill = parseFloat(
    (discountedBill - pointDiscount).toFixed(4)
  );

  // ===============================
  // ⭐ Earn Point Calculation (UPDATED LOGIC)
  // ===============================

  // Net bill eligible for earning points
  const netBillForPoint = Math.max(totalBill - totalGrossValue, 0);

  // Get active tier
  const userTier = await Tier.findOne({
    admin: merchantId,
    isActive: true,
    pointsThreshold: { $lte: digitalCard.lifeTimeEarnPoints || 0 },
  }).sort({ pointsThreshold: -1 });

  const accumulationPercentage = userTier?.accumulationRule || 0;

  const eligibleAmount =
    (netBillForPoint * accumulationPercentage) / 100;

  const pointsEarned = parseFloat(
    (eligibleAmount / POINT_EARN_RATE).toFixed(4)
  );

  // ===============================
  // 📦 Final Response
  // ===============================

  const formattedData = {
    merchantId,
    userId: digitalCard.userId,
    digitalCard: digitalCard._id,
    digitalCardCode: digitalCard.cardCode,

    appliedPromotionIds,
    promotionsDetail,

    totalBill: parseFloat(totalBill.toFixed(4)),
    totalGrossValue,
    totalDiscount,

    discountedBill,
    pointRedeemed,
    pointDiscount,

    finalBill,

    netBillForPoint,
    accumulationPercentage,
    eligibleAmount,
    pointsEarned,

    userTier: userTier
      ? {
          name: userTier.name,
          accumulationPercentage: userTier.accumulationRule,
        }
      : null,
  };

  console.log("✅ requestApproval result:", formattedData);
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
  if (!Types.ObjectId.isValid(digitalCardId)) {
    throw new Error("Invalid digitalCardId");
  }

  const typeSanitized = type.trim().toLowerCase() as "all" | "earn" | "use";

  const query: any = {
    digitalCardId: new Types.ObjectId(digitalCardId),
  };

  if (typeSanitized === "earn") query.pointsEarned = { $gt: 0 };
  if (typeSanitized === "use") query.pointRedeemed = { $gt: 0 };

  const history = await Sell.find(query)
    .sort({ createdAt: -1 })
    .populate("merchantId", "businessName shopName firstName profile")
    .lean();

  const result: any[] = [];

  for (const tx of history) {
    const merchant = tx.merchantId as
      | {
        _id?: Types.ObjectId;
        businessName?: string;
        shopName?: string;
        firstName?: string;
        profile?: string;
      }
      | undefined;

    const merchantName =
      merchant?.businessName ||
      merchant?.shopName ||
      merchant?.firstName ||
      "";

    // ⭐ find rating (only number)
    const ratingDoc = await Rating.findOne({
      userId: tx.userId,
      merchantId: merchant?._id,
      promotionId: tx.promotionId,
      digitalCardId: tx.digitalCardId,
    })
      .select("rating")
      .lean();

    const ratingValue: number | null = ratingDoc
      ? ratingDoc.rating
      : 0;

    // ✅ Earn Points
    if (
      (typeSanitized === "all" || typeSanitized === "earn") &&
      (tx.pointsEarned ?? 0) > 0
    ) {
      result.push({
        id: tx._id,
        digitalCardId: tx.digitalCardId,
        isEarn: true,
        type: "earn",
        points: tx.pointsEarned,
        totalBill: tx.totalBill,
        discountedBill: tx.discountedBill,
        date: tx.createdAt,
        promotionId: tx.promotionId,

        merchant: merchantName,
        merchantProfile: merchant?.profile,
        merchantId: merchant?._id,

        rating: ratingValue, // ✅ number | null
      });
    }

    // ✅ Used Points
    if (
      (typeSanitized === "all" || typeSanitized === "use") &&
      (tx.pointRedeemed ?? 0) > 0
    ) {
      result.push({
        id: tx._id,
        digitalCardId: tx.digitalCardId,
        isEarn: false,
        type: "use",
        points: tx.pointRedeemed,
        totalBill: tx.totalBill,
        discountedBill: tx.discountedBill,
        date: tx.createdAt,
        promotionId: tx.promotionId,

        merchant: merchantName,
        merchantProfile: merchant?.profile,
        merchantId: merchant?._id,

        rating: ratingValue, // ✅ number | null
      });
    }
  }

  return result;
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
