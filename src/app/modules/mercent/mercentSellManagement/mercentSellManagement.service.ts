import { Types } from "mongoose";
import { Promotion } from "../../mercent/promotionMercent/promotionMercent.model";
import { DigitalCard } from "../../customer/digitalCard/digitalCard.model";
import { Sell } from "./mercentSellManagement.model";
import { RequestApprovalOptions } from "./mercentSellManagement.interface";


// -----------------------------
// 1. Merchant → Checkout
// -----------------------------
const checkout = async (
  merchantId: string,
  digitalCardCode: string,
  totalBill: number,
  promotionId?: string,
  pointRedeemed: number = 0 // optional points redeemed
) => {
  const POINT_CONVERSION_RATE = 0.05; // 1 point = 0.05 currency

  console.log("💠 Checkout Start");
  console.log("💠 merchantId:", merchantId);
  console.log("💠 digitalCardCode:", digitalCardCode);
  console.log("💠 totalBill:", totalBill);
  console.log("💠 promotionId:", promotionId);
  console.log("💠 pointRedeemed:", pointRedeemed);

  // 1. Find Digital Card
  const digitalCard = await DigitalCard.findOne({
    merchantId: new Types.ObjectId(merchantId),
    cardCode: digitalCardCode
  });

  if (!digitalCard) {
    throw new Error("Digital Card not found for this merchant");
  }

  console.log("💠 Digital Card Found:", digitalCard._id.toString());

  let discount = 0;
  let selectedPromotion: any = null;

  // 2. Handle Promotion if provided
  if (promotionId) {
    selectedPromotion = await Promotion.findById(promotionId);

    if (!selectedPromotion) {
      throw new Error("Promotion not found");
    }

    console.log("💠 Selected Promotion:", selectedPromotion.name, "-", selectedPromotion.discountPercentage, "%");

    const promoIndex = digitalCard.promotions.findIndex(
      p => p.promotionId?.toString() === promotionId
    );

    if (promoIndex === -1) {
      throw new Error("Promotion not added to this DigitalCard");
    }

    const promo = digitalCard.promotions[promoIndex];

    // Check promotion status
    console.log("💠 Promotion Status:", promo.status);
    if (promo.status === "unused") {
      promo.status = "used";
      promo.usedAt = new Date();
      discount = selectedPromotion.discountPercentage || 0;
    } else if (promo.status === "pending") {
      throw new Error("User approval needed for this promotion");
    } else {
      throw new Error("Promotion already used or expired");
    }

    await digitalCard.save();
    console.log("💠 Digital Card updated with promotion status");
  }

  // 3. Calculate discounted bill
  const discountedBill = totalBill - (totalBill * discount) / 100;
  console.log("💠 Discount Applied:", discount, "%");
  console.log("💠 Discounted Bill:", discountedBill);

  // 4. Calculate point discount
  const pointDiscount = pointRedeemed * POINT_CONVERSION_RATE;
  console.log("💠 Point Discount:", pointDiscount);

  // 5. Calculate final bill after points redeemed
  const finalBill = discountedBill - pointDiscount;
  console.log("💠 Final Bill:", finalBill);

  // 6. Points earned
  const pointsEarned = discountedBill;
  console.log("💠 Points Earned:", pointsEarned);

  // 7. Update digital card points
  digitalCard.availablePoints = (digitalCard.availablePoints || 0) + pointsEarned;
  await digitalCard.save();
  console.log("💠 Digital Card Points Updated:", digitalCard.availablePoints);

  // 8. Save transaction
  const sell = await Sell.create({
    merchantId,
    userId: digitalCard.userId,
    digitalCardId: digitalCard._id,
    promotionId: selectedPromotion?._id,
    totalBill,
    discountedBill,
    pointRedeemed,
    pointDiscount,
    finalBill,
    pointsEarned,
    status: "completed" // or "pending" if you want to keep original
  });

  console.log("💠 Transaction Saved:", sell._id.toString());

  return sell;
};




// -----------------------------
// 2. Merchant → Request Approval
// -----------------------------
// const requestApproval = async (
//   merchantId: string,
//   digitalCardCode: string,
//   promotionId: string
// ) => {

//   const digitalCard = await DigitalCard.findOne({
//     merchantId: new Types.ObjectId(merchantId),
//     cardCode: digitalCardCode,
//   });

//   if (!digitalCard) {
//     throw new Error("Digital card not found for this merchant");
//   }

//   const promo = digitalCard.promotions.find(
//     (p) => p.promotionId?.toString() === promotionId
//   );

//   if (!promo) {
//     throw new Error("Promotion not found in digital card");
//   }

//   if (promo.status !== "pending") {
//     throw new Error("Promotion does not require approval");
//   }

//   // এখানে চাইলে push notification পাঠাতে পারো
//   // notifyUser(digitalCard.userId, "Merchant requested approval");

//   return { userId: digitalCard.userId };
// };

const requestApproval = async ({
  merchantId,
  digitalCardCode,
  promotionId,
  totalBill = 0,
  pointRedeemed = 0,
}: RequestApprovalOptions) => {
  const POINT_CONVERSION_RATE = 0.05; // 1 point = 0.05 currency

  // 1. Find Digital Card
  const digitalCard = await DigitalCard.findOne({
    merchantId: new Types.ObjectId(merchantId),
    cardCode: digitalCardCode,
  });

  if (!digitalCard) {
    throw new Error("Digital Card not found for this merchant");
  }

  // 2. Find promotion inside digital card
  const promo = digitalCard.promotions.find(
    (p) => p.promotionId?.toString() === promotionId
  );

  if (!promo) {
    throw new Error("Promotion not found in digital card");
  }

  if (promo.status !== "pending") {
    throw new Error("Promotion does not require approval");
  }

  // 3. Fetch promotion details
  const selectedPromotion = await Promotion.findById(promotionId);
  const discount = selectedPromotion?.discountPercentage || 0;

  // 4. Simulate discounted bill
  const discountedBill = totalBill - (totalBill * discount) / 100;

  // 5. Calculate redeemed points discount
  const pointDiscount = pointRedeemed * POINT_CONVERSION_RATE;

  // 6. Calculate final bill
  const finalBill = discountedBill - pointDiscount;

  // 7. Simulate points earned
  const pointsEarned = discountedBill;

  // 8. Return simulated response
  return {
    merchantId,
    userId: digitalCard.userId,
    digitalCardId: digitalCard._id,
    promotionId,
    totalBill,
    discountedBill,
    pointRedeemed,
    pointDiscount,
    finalBill,
    pointsEarned,
  };
};


// -----------------------------
const getPendingRequests = async (userId: string) => {
  const cards = await DigitalCard.find({
    userId: new Types.ObjectId(userId),
    "promotions.status": "pending"
  });

  interface PendingRequest {
    digitalCardId: Types.ObjectId;
    promotionId: Types.ObjectId | undefined | null;
    cardCode: string;
  }

  const requests: PendingRequest[] = [];
  cards.forEach(card => {
    card.promotions.forEach(p => {
      if (p.status === "pending") {
        requests.push({
          digitalCardId: card._id,
          promotionId: p.promotionId,
          cardCode: card.cardCode
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
  digitalCardId: string,
  promotionId: string,
  userId: string
) => {

  const digitalCard = await DigitalCard.findOne({
    _id: new Types.ObjectId(digitalCardId),
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
  digitalCardId: string,
  promotionId: string,
  userId: string
) => {

  const digitalCard = await DigitalCard.findOne({
    _id: new Types.ObjectId(digitalCardId),
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



const getPointsHistory = async (
  digitalCardId: string,
  type: "all" | "earn" | "redeem" = "all"
) => {
  const query: any = { digitalCardId: new Types.ObjectId(digitalCardId) };

  if (type === "earn") query.pointsEarned = { $gt: 0 };
  if (type === "redeem") query.pointsEarned = { $lt: 0 };

  const history = await Sell.find(query).sort({ createdAt: -1 });

  // map করে front-end friendly format বানাচ্ছি
  return history.map(tx => ({
    transactionId: tx._id,
    totalBill: tx.totalBill,
    discountedBill: tx.discountedBill,
    points: tx.pointsEarned,
    promotionId: tx.promotionId,
    status: tx.status,
    date: tx.createdAt
  }));
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
  getPointsHistory
};
