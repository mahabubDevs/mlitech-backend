import { Types } from "mongoose";
import { Promotion } from "../../mercent/promotionMercent/promotionMercent.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import { Sell } from "./mercentSellManagement.model";
import { RequestApprovalOptions } from "./mercentSellManagement.interface";
import { NotificationType } from "../../notification/notification.model";
import { sendNotification } from "../../../../helpers/notificationsHelper";
import { Tier } from "../point&TierSystem/tier.model";
import { Rating } from "../../customer/rating/rating.model";
import { subMonths } from "date-fns"; 
import { sendPushNotification } from "../../../../helpers/sendPushNotification";
import { User } from "../../user/user.model";
// -----------------------------



// const checkout = async (
//   merchantId: string,
//   digitalCardCode: string,
//   totalBill: number,
//   promotionIds: string[] = [],
//   pointRedeemed: number = 0
// ) => {
//   const POINT_EARN_RATE = 10;
//   const POINT_REDEEM_RATE = 10;

//   // ===============================
//   // 🔍 Find Digital Card
//   // ===============================
//   const digitalCard = await DigitalCard.findOne({
//     merchantId,
//     cardCode: digitalCardCode,
//   });

//   if (!digitalCard) {
//     throw new Error("Digital Card not found");
//   }

//   // ===============================
// // 🎯 Promotion Validation
// // ===============================
// let totalGrossValue = 0;
// let totalDiscount = 0;

// for (const promoId of promotionIds) {
//   const promoInCard = digitalCard.promotions.find(
//     (p: any) => p.promotionId?.toString() === promoId
//   );

//   if (!promoInCard) {
//     throw new Error(`Promotion ${promoId} not found in digital card`);
//   }

//   // ✅ FIXED STATUS CHECK
//   if (promoInCard.status === "used") {
//     throw new Error(`Promotion ${promoId} already used`);
//   }

//   const promotion = await Promotion.findById(promoId);
//   if (!promotion) {
//     throw new Error(`Promotion ${promoId} not found`);
//   }

//   const grossValue = promotion.grossValue || 0;
//   const discountPercentage = promotion.discountPercentage || 0;
//   const discountAmount = (grossValue * discountPercentage) / 100;

//   totalGrossValue += grossValue;
//   totalDiscount += discountAmount;

//   // ✅ ONLY HERE promotion is marked as used
//   promoInCard.status = "used";
//   promoInCard.usedAt = new Date();
// }

// await digitalCard.save();

//   // ===============================
//   // 💰 Bill Calculation
//   // ===============================
//   const discountedBill = parseFloat(
//     (totalBill - totalDiscount).toFixed(4)
//   );

//   const pointDiscount = parseFloat(
//     (pointRedeemed * POINT_REDEEM_RATE).toFixed(4)
//   );

//   const finalBill = parseFloat(
//     (discountedBill - pointDiscount).toFixed(4)
//   );

//   if(finalBill < 0) {
//     throw new Error("Final bill cannot be negative");
//   }

//   // ===============================
//   // ⭐ Tier & Earn Point Calculation
//   // ===============================
//   const netBillForPoint = Math.max(
//     totalBill - totalGrossValue,
//     0
//   );

//   const userTier = await Tier.findOne({
//     admin: merchantId,
//     isActive: true,
//     pointsThreshold: { $lte: digitalCard.lifeTimeEarnPoints || 0 },
//   }).sort({ pointsThreshold: -1 });

//   const accumulationPercentage =
//     userTier?.accumulationRule || 0;

//   const eligibleAmount =
//     (netBillForPoint * accumulationPercentage) / 100;

//   const pointsEarned = parseFloat(
//     (eligibleAmount / POINT_EARN_RATE).toFixed(4)
//   );

//   // ===============================
//   // 🔄 Update Digital Card
//   // ===============================
//   if (pointRedeemed > digitalCard.availablePoints) {
//     throw new Error("Not enough available points");
//   }

//   digitalCard.availablePoints = parseFloat(
//     (
//       digitalCard.availablePoints +
//       pointsEarned -
//       pointRedeemed
//     ).toFixed(4)
//   );

//   digitalCard.lifeTimeEarnPoints = parseFloat(
//     (
//       digitalCard.lifeTimeEarnPoints +
//       pointsEarned
//     ).toFixed(4)
//   );

//   await digitalCard.save();

//   // ===============================
//   // 🧾 Save Transaction
//   // ===============================
//   const sell = await Sell.create({
//     merchantId,
//     userId: digitalCard.userId,
//     digitalCardId: digitalCard._id,
//     promotionIds,
//     totalBill,
//     totalGrossValue,
//     totalDiscount,
//     discountedBill,
//     pointRedeemed,
//     pointDiscount,
//     finalBill,
//     pointsEarned,
//     status: "completed",
//   });

//   // ===============================
//   // 🔔 Notifications
//   // ===============================
//   if (pointsEarned > 0) {
//     await sendNotification({
//       userIds: [digitalCard.userId.toString()],
//       title: "Points Earned",
//       body: `You earned ${pointsEarned} points`,
//       type: NotificationType.POINTS,
//     });
//   }

//   if (pointRedeemed > 0) {
//     await sendNotification({
//       userIds: [digitalCard.userId.toString()],
//       title: "Points Redeemed",
//       body: `You redeemed ${pointRedeemed} points`,
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
  console.log("=================================================");
  console.log("🚀 checkout START");
  console.log("🔹 Input:", { merchantId, digitalCardCode, totalBill, promotionIds, pointRedeemed });
  console.log("=================================================");

  const POINT_REDEEM_RATE = 10; // 1 point = 10 taka
  const POINT_EARN_RATE = 10;   // 10 taka = 1 point

  // ===============================
  // 🔍 Find Digital Card
  // ===============================
  const digitalCard = await DigitalCard.findOne({
    merchantId,
    cardCode: digitalCardCode,
  });

  if (!digitalCard) throw new Error("Digital Card not found");





  // ===============================
// 🔐 Validate User Status
// ===============================
  const cardUser = await User.findById(digitalCard.userId);

  if (!cardUser) {
    throw new Error("User not found");
  }

  if (cardUser.status !== "active") {
    throw new Error("User account is inactive. Checkout not allowed.");
  }

  if (cardUser.subscription !== "active") {
    throw new Error("User subscription is not active.");
  }

  console.log("✅ User validation passed:", cardUser._id.toString());

  // ===============================
  // 🔍 Validate Redeem Points
  // ===============================
  if (pointRedeemed > digitalCard.availablePoints) {
    throw new Error("Not enough available points");
  }

  // ===============================
  // 🔖 Apply Promotions (if any)
  // ===============================
  let totalDiscount = 0;
  let totalGrossValue = 0;

  for (const promoId of promotionIds) {
    const promoInCard = digitalCard.promotions.find(
      p => p.promotionId?.toString() === promoId
    );

    if (!promoInCard) {
      throw new Error(`Promotion ${promoId} not found in card`);
    }

    // if (!["pending", "unused"].includes(promoInCard.status)) {
    //   throw new Error(`Promotion ${promoId} already used`);
    // }

    const promotion = await Promotion.findById(promoId);
    if (!promotion) {
      throw new Error(`Promotion ${promoId} not found in DB`);
    }

    const grossValue = promotion.grossValue || 0;
    const discountPercentage = promotion.discountPercentage || 0;
    const discountAmount = (grossValue * discountPercentage) / 100;

    totalGrossValue += grossValue;
    totalDiscount += discountAmount;

    console.log(`🔹 Promotion applied: ${promoId}`, {
      grossValue,
      discountPercentage,
      discountAmount,
    });
  }


  // ==============================
  //  Tier upergread 
  // ==============================


  const nextTier = await Tier.findOne({
    admin: merchantId,
    isActive: true,
    pointsThreshold: { $lte: digitalCard.lifeTimeEarnPoints || 0 },
  }).sort({ pointsThreshold: -1 });

  console.log("✅ User Tier:", nextTier ? nextTier.name : "No tier");


  const upcomingTier = await Tier.findOne({
  admin: merchantId,
  isActive: true,
  pointsThreshold: { $gt: digitalCard.lifeTimeEarnPoints || 0 },
}).sort({ pointsThreshold: 1 }); // smallest threshold first

  console.log("✅ Upcoming Tier:", upcomingTier ? upcomingTier.name : "No upcoming tier");
  console.log("✅ Points to next tier:", upcomingTier ? upcomingTier.pointsThreshold - (digitalCard.lifeTimeEarnPoints || 0) : "N/A");
  console.log("✅ Next tier reward:", upcomingTier ? upcomingTier.reward : "N/A");




  
  // ===============================
  // 💰 Bill Calculation
  // ===============================
  const discountedBills = parseFloat((totalBill - totalDiscount).toFixed(4));
  const pointDiscount = parseFloat((pointRedeemed * POINT_REDEEM_RATE).toFixed(4));
  const discountedBill = parseFloat((discountedBills - pointDiscount).toFixed(4));


  const sixMonthsAgo = subMonths(new Date(), 6);

  if (digitalCard.updatedAt < sixMonthsAgo && pointRedeemed > 0) {
    throw new Error(
      "Your points are blocked due to inactivity in the last 6 months."
    );
  }

  const finalBill = parseFloat((discountedBill).toFixed(4));

  if (finalBill < 0) {
    throw new Error("Final bill cannot be negative");
  }

  console.log("🔹 Total Discount:", totalDiscount);
  console.log("🔹 Discounted Bill:", discountedBill);
  console.log("🔹 Point Discount:", pointDiscount);
  console.log("🔹 Final Bill:", finalBill);

  // ===============================
  // ⭐ Points Earn Calculation
  // ===============================
  const netBillForPoint = Math.max(totalBill - totalGrossValue, 0);

  const userTier = await Tier.findOne({
    admin: merchantId,
    isActive: true,
    pointsThreshold: { $lte: digitalCard.lifeTimeEarnPoints || 0 },
  }).sort({ pointsThreshold: -1 });

  const accumulationPercentage = userTier?.accumulationRule || 0;
  const eligibleAmount = (netBillForPoint * accumulationPercentage) / 100;


  let pointsEarned = parseFloat((eligibleAmount / POINT_EARN_RATE).toFixed(4));

 
  if (upcomingTier && (eligibleAmount / POINT_EARN_RATE + (digitalCard.lifeTimeEarnPoints || 0) >= upcomingTier.pointsThreshold)) {
   
    const additionalRewardPoints = Number(upcomingTier.reward) || 0;

   
    pointsEarned = parseFloat((pointsEarned + additionalRewardPoints).toFixed(4));
  }

  console.log("🔹 Points Earned:", pointsEarned);
 




  // ===============================
  // 🔹 Approval condition
  // ===============================
  const needApproval = pointRedeemed > 0;


  // approval expire time (2 minutes)
const approvalExpiresAt = needApproval
  ? new Date(Date.now() + 2 * 60 * 1000)
  : null;

  // ===============================
  // 🧾 Create Sell Record
  // ===============================
  const sell = await Sell.create({
    merchantId,
    userId: digitalCard.userId,
    digitalCardId: digitalCard._id,
    digitalCardCode,

    // ✅ FIXED HERE (ARRAY SUPPORT)
    promotionIds: promotionIds.length ? promotionIds : [],

    totalBill,
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

    status: needApproval ? "pending" : "completed",
    approvalExpiresAt,
  });



  // ===============================
  // 🔔 Update Digital Card Points
  // ===============================
  if (!needApproval) {
    digitalCard.availablePoints =
      digitalCard.availablePoints - pointRedeemed + pointsEarned;

    digitalCard.lifeTimeEarnPoints =
      (digitalCard.lifeTimeEarnPoints || 0) + pointsEarned;

    for (const promoId of promotionIds) {
      const promoInCard = digitalCard.promotions.find(
        p => p.promotionId?.toString() === promoId
      );
      if (promoInCard) {
        promoInCard.status = "used";
        promoInCard.usedAt = new Date();
      }
    }

    await digitalCard.save();

    console.log(
      "🔹 DigitalCard updated. Available Points:",
      digitalCard.availablePoints
    );
  } else {
    console.log("🔹 Approval pending, DigitalCard points not updated yet.");
  }

  // ===============================
  // 🔔 Socket Approval
  // ===============================
  if (needApproval) {
    const io = (global as any).io;
    if (io) {
      io.emit(`getApplyRequest::${digitalCard.userId}`, {
        sellId: sell._id,
        merchantId,
        digitalCardCode,
        totalBill,
        discountedBill,
        finalBill,
        pointRedeemed,
        promotionIds,
        pointsEarned,
        message: "Merchant requested checkout approval",
      });

      console.log(
        "💠 Approval request sent to user:",
        digitalCard.userId.toString()
      );
    }
  }



// if (needApproval) {
//   const io = (global as any).io;
//   const payload = {
//     sellId: sell._id,
//     merchantId,
//     digitalCardCode,
//     totalBill,
//     discountedBill,
//     finalBill,
//     pointRedeemed,
//     promotionIds,
//     pointsEarned,
//     message: "Merchant requested checkout approval",
//   };

//   // 🔹 Socket.IO v4+ compatible
//   const socketsArray = Array.from(io?.sockets?.sockets?.values() || []);

//   // 🔹 Check user connected using socket.data.userId
//   const userSockets = socketsArray.filter(
//     (s: any) => s.data?.userId?.toString() === digitalCard.userId.toString()
//   );

//   if (userSockets.length > 0) {
//     // Emit to all sockets of this user
//     userSockets.forEach((s: any) => {
//       s.emit(`getApplyRequest::${digitalCard.userId}`, payload);
//     });
//     console.log("💠 Approval request sent via socket:", digitalCard.userId.toString());
//   } else {
//     console.log("🔔 User not connected via socket. Sending push notification...");

//     // Push notification logic
//     const user = await User.findById(digitalCard.userId);
//     if (user?.fcmToken) {
//       sendPushNotification(
//         user.fcmToken,
//         "Checkout Approval Required",
//         `You have a pending checkout approval for card ${digitalCardCode}.`
//       );
//       console.log("🔔 Push notification sent to user:", user._id.toString());
//     }
//   }
// }

  console.log("=================================================");
  console.log("🚀 checkout END");
  console.log("=================================================");

  return sell;
};







// -----------------------------








const requestApproval = async ({
  merchantId,
  digitalCardCode, // DG-xxxx or PC-xxxx
  promotionId = null, // string | string[]
  totalBill = 0,
  pointRedeemed = 0,
}: RequestApprovalOptions) => {
  const POINT_EARN_RATE = 10;    // 10 taka = 1 point
  const POINT_REDEEM_RATE = 10;  // 1 point = 10 taka



// -----------------------------
  // 🔹 Check if merchant has at least one active tier
  // -----------------------------
  const activeTierExists = await Tier.exists({
    admin: merchantId,
    isActive: true,
  });

  if (!activeTierExists) {
    throw new Error(
      "Merchant has no active tier. Please create a tier before processing sales."
    );
  }





  let digitalCard: any = null;

  // 🔹 Normalize promotionId to array
  let appliedPromotionIds: string[] = [];
  if (promotionId) {
    appliedPromotionIds = Array.isArray(promotionId)
      ? promotionId
      : [promotionId];
  }



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

    // if (!["pending", "unused"].includes(promoInCard.status)) {
    //   throw new Error(`Promotion ${promoId} already used`);
    // }

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


  // 🔹 Add check: totalBill >= totalGrossValue
if (totalBill < totalGrossValue) {
  throw new Error(
    `Total bill (${totalBill}) is less than total promotions gross value (${totalGrossValue})`
  );
}
  // ===============================
  // 💰 Bill Calculation
  // ===============================

  const discountedBills = parseFloat(
    (totalBill - totalDiscount).toFixed(4)
  );

  const pointDiscount = parseFloat(
    (pointRedeemed * POINT_REDEEM_RATE).toFixed(4)
  );


  // 🔹 Check Digital Card Activity (6 months rule)
const sixMonthsAgo = subMonths(new Date(), 6);

if (digitalCard.updatedAt < sixMonthsAgo && pointRedeemed > 0) {
  throw new Error(
    "Your points are blocked due to inactivity in the last 6 months."
  );
}



// // 5 মিনিট আগে
// const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 min * 60 sec * 1000 ms

// if (digitalCard.updatedAt < fiveMinutesAgo && pointRedeemed > 0) {
//   throw new Error(
//     "Your points are blocked due to inactivity in the last 5 minutes."
//   );
// }


  const finalBill = parseFloat(
    (discountedBills - pointDiscount).toFixed(4)
  );

  if(finalBill < 0) {
    throw new Error("Final bill cannot be negative");
  }

  const discountedBill = totalBill - finalBill;

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

    discountedBill: parseFloat(discountedBill.toFixed(4)),
    pointRedeemed,
    pointDiscount,

    finalBill,

    netBillForPoint,
    accumulationPercentage,
    eligibleAmount,
    pointsEarned,
    // finaldiscountedBill: parseFloat(discountedBills.toFixed(4)),

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
// const approvePromotion = async (
//   digitalCardCode: string,
//   promotionId: string,
//   userId: string
// ) => {
//   const digitalCard = await DigitalCard.findOne({
//     cardCode: digitalCardCode,
//     userId: new Types.ObjectId(userId),
//   });

//   if (!digitalCard) {
//     throw new Error("Digital card not found for user");
//   }

//   const promo = digitalCard.promotions.find(
//     (p) => p.promotionId?.toString() === promotionId
//   );

//   if (!promo) {
//     throw new Error("Promotion not found in card");
//   }

//   if (promo.status !== "pending") {
//     throw new Error("Promotion already approved or used");
//   }

//   // Approval done
//   promo.status = "unused";

//   await digitalCard.save();

//   return { status: "approved" };
// };


const approvePromotion = async (
  digitalCardCode: string,
  promotionIds: string[],
  userId: string,
  sellId?: string
) => {
  console.log("=================================================");
  console.log("🚀 approvePromotion START");
  console.log("=================================================");

  // -------------------------------
  // 🔍 Find Digital Card
  // -------------------------------
  const digitalCard = await DigitalCard.findOne({
    cardCode: digitalCardCode,
    userId: new Types.ObjectId(userId),
  });

  if (!digitalCard) throw new Error("Digital card not found");

  console.log("✅ DigitalCard found:", digitalCardCode, "UserID:", digitalCard.userId.toString());

  // -------------------------------
  // 🔍 Find pending sell
  // -------------------------------
  const sell = await Sell.findOne({
    _id: sellId, // <-- use exact sell
    digitalCardId: digitalCard._id,
    status: "pending",
});




  if (!sell) throw new Error("Pending checkout not found");

// ⏱ Expire validation (2 minutes)
if (sell.approvalExpiresAt && sell.approvalExpiresAt < new Date()) {
  sell.status = "expired";
  await sell.save();

  throw new Error("Approval request expired (2 minutes)");
}

  console.log("📌 Pending Sell found:", sell._id.toString());
  console.log("🔹 Sell Total Bill:", sell.totalBill);
  console.log("🔹 Sell Points Redeemed:", sell.pointRedeemed);
  console.log("🔹 Sell Points Earned:", sell.pointsEarned);

  // Prevent double approval
  if (sell.status === "completed") {
    console.log("⚠️ Sell already completed. Skipping points update.");
    return {
      sellId: sell._id,
      approvedPromotions: [],
      pointsEarned: sell.pointsEarned,
      pointsRedeemed: sell.pointRedeemed,
    };
  }

  // -------------------------------
  // 🔖 Mark promotions as USED
  // -------------------------------
  const approvedPromotions: string[] = [];
  for (const promotionId of promotionIds) {
    const promo = digitalCard.promotions.find(
      p => p.promotionId?.toString() === promotionId
    );

    if (!promo || promo.status !== "pending") continue;

    promo.status = "used";
    promo.usedAt = new Date();
    approvedPromotions.push(promotionId);
  }

  // -------------------------------
  // 💰 Finalize Points (Fraction safe)
  // -------------------------------
  const redeemed = parseFloat(((sell.pointRedeemed as number) || 0).toFixed(4));
  const earned = parseFloat(((sell.pointsEarned as number) || 0).toFixed(4));

  digitalCard.availablePoints = parseFloat(
    ((digitalCard.availablePoints || 0) - redeemed + earned).toFixed(4)
  );

  digitalCard.lifeTimeEarnPoints = parseFloat(
    ((digitalCard.lifeTimeEarnPoints || 0) + earned).toFixed(4)
  );

  if (digitalCard.lifeTimeEarnPoints < 0) digitalCard.lifeTimeEarnPoints = 0;

  await digitalCard.save();

  console.log("🔹 DigitalCard updated:");
  console.log("   Available Points:", digitalCard.availablePoints);
  console.log("   LifeTime Earned Points:", digitalCard.lifeTimeEarnPoints);

  // -------------------------------
  // ✅ Finalize Sell
  // -------------------------------
  sell.status = "completed";
  await sell.save();

  console.log("✅ Sell approved & completed:", sell._id.toString());
  console.log("🔹 Points Redeemed:", redeemed);
  console.log("🔹 Points Earned:", earned);
  console.log("🔹 Promotions Approved:", approvedPromotions);

  console.log("=================================================");
  console.log("🚀 approvePromotion END");
  console.log("=================================================");

  return {
    sellId: sell._id,
    approvedPromotions,
    pointsEarned: earned,
    pointsRedeemed: redeemed,
  };
};



const approvePromotionReject = async (
  digitalCardCode: string,
  promotionIds: string[],
  userId: string,
  sellId?: string
) => {
  console.log("=================================================");
  console.log("🚀 approvePromotionReject START");
  console.log("=================================================");

  // -------------------------------
  // 🔍 Find Digital Card
  // -------------------------------
  const digitalCard = await DigitalCard.findOne({
    cardCode: digitalCardCode,
    userId: new Types.ObjectId(userId),
  });

  if (!digitalCard) throw new Error("Digital card not found");

  console.log("✅ DigitalCard found:", digitalCardCode, "UserID:", digitalCard.userId.toString());

  // -------------------------------
  // 🔍 Find pending sell
  // -------------------------------
  const sellQuery: any = {
    digitalCardId: digitalCard._id,
    status: "pending",
  };
  if (sellId) sellQuery._id = sellId;

  const sell = await Sell.findOne(sellQuery);

  if (!sell) throw new Error("Pending checkout not found");

  console.log("📌 Pending Sell found:", sell._id.toString());
  console.log("🔹 Sell Total Bill:", sell.totalBill);
  console.log("🔹 Sell Points Redeemed:", sell.pointRedeemed);
  console.log("🔹 Sell Points Earned:", sell.pointsEarned);

  // Prevent double rejection
  if (sell.status === "rejected") {
    console.log("⚠️ Sell already rejected. Skipping rollback.");
    return {
      sellId: sell._id,
      rejectedPromotions: [],
    };
  }

  // -------------------------------
  // 🔖 Rollback promotions
  // -------------------------------
  const rejectedPromotions: string[] = [];
  for (const promotionId of promotionIds) {
    const promo = digitalCard.promotions.find(
      p => p.promotionId?.toString() === promotionId
    );
    if (!promo) continue;

    promo.status = "pending";
    promo.usedAt = null;
    rejectedPromotions.push(promotionId);
  }

  // -------------------------------
  // ❌ Reject sell WITHOUT points change
  // -------------------------------
  sell.status = "rejected";
  await sell.save();

  console.log("🔴 Sell rejected (points untouched):", sell._id.toString());

  console.log("=================================================");
  console.log("🚀 approvePromotionReject END");
  console.log("=================================================");

  return {
    rejectedPromotions,
    sellId: sell._id,
  };
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
    const merchant = tx.merchantId as any;

    const merchantName =
      merchant?.businessName || merchant?.shopName || merchant?.firstName || "";

    const ratingDoc = await Rating.findOne({
      userId: tx.userId,
      merchantId: merchant?._id,
      promotionId: tx.promotionIds?.[0], // আমরা প্রথম promotion দিয়ে rating check করছি
      digitalCardId: tx.digitalCardId,
    }).select("rating").lean();

    const ratingValue = ratingDoc ? ratingDoc.rating : 0;

    // যদি promotionIds empty না থাকে
    const promotions = tx.promotionIds && tx.promotionIds.length > 0 ? tx.promotionIds : [null];

    for (const promoId of promotions) {
      // ✅ Earn Points
      if ((typeSanitized === "all" || typeSanitized === "earn") && ((tx.pointsEarned as number) ?? 0) > 0) {
        result.push({
          id: tx._id,
          digitalCardId: tx.digitalCardId,
          isEarn: true,
          type: "earn",
          points: tx.pointsEarned,
          totalBill: tx.totalBill,
          discountedBill: tx.discountedBill,
          date: tx.createdAt,
          promotionIds: promoId, // single entry
          merchant: merchantName,
          merchantProfile: merchant?.profile,
          merchantId: merchant?._id,
          rating: ratingValue,
        });
      }

      // ✅ Used Points
      if ((typeSanitized === "all" || typeSanitized === "use") && ((tx.pointRedeemed as number) ?? 0) > 0) {
        result.push({
          id: tx._id,
          digitalCardId: tx.digitalCardId,
          isEarn: false,
          type: "use",
          points: tx.pointRedeemed,
          totalBill: tx.totalBill,
          discountedBill: tx.discountedBill,
          date: tx.createdAt,
          promotionIds: promoId, // single entry
          merchant: merchantName,
          merchantProfile: merchant?.profile,
          merchantId: merchant?._id,
          rating: ratingValue,
        });
      }
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

  const query: any = {
     userId: new Types.ObjectId(userId),
      status: "completed"
   };
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
