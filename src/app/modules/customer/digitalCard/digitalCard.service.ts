import mongoose, { Types } from "mongoose";
import { Promotion } from "../../mercent/promotionMercent/promotionMercent.model";
import { DigitalCard } from "./digitalCard.model";
import { generateCardCode } from "./generateCardCode";
import QueryBuilder from "../../../../util/queryBuilder";
import { IDigitalCard } from "../../mercent/mercentCustomerList/mercentInterface";

// const addPromotionToDigitalCard = async (
//   userId: string,
//   promotionId: string
// ) => {

//   // Promotion check
//   const promotion = await Promotion.findById(promotionId);
//   if (!promotion) {
//     throw new Error("Promotion not found");
//   }

//   const merchantId = promotion.merchantId;

//   // Digital card check (user + merchant)
//   let digitalCard = await DigitalCard.findOne({ userId, merchantId });

//   // If digital card does not exist → create new
//   if (!digitalCard) {
//     digitalCard = await DigitalCard.create({
//       userId,
//       merchantId,
//       cardCode: generateCardCode(),
//       promotions: [],
//     });
//   }

//   // Convert promotionId → ObjectId
//   const promotionObjectId = new Types.ObjectId(promotionId);

//   // Add promotion if not exists already
//   if (!digitalCard.promotions.includes(promotionObjectId)) {
//     digitalCard.promotions.push(promotionObjectId);
//   }

//   // Save changes
//   await digitalCard.save();

//   return digitalCard;
// };

const addPromotionToDigitalCard = async (
  userId: string,
  promotionId: string
) => {
  // Promotion check
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new Error("Promotion not found");
  }

  const merchantId = promotion.merchantId;

  // Digital card check (user + merchant)
  let digitalCard = await DigitalCard.findOne({ userId, merchantId });

  // If digital card does not exist → create new
  if (!digitalCard) {
    digitalCard = await DigitalCard.create({
      userId,
      merchantId,
      cardCode: generateCardCode(),
      promotions: [],
    });
  }

  // Convert promotionId → ObjectId
  const promotionObjectId = new Types.ObjectId(promotionId);

  // Add promotion if not exists already
  const alreadyAdded = digitalCard.promotions.some(
    (p) => p.promotionId && p.promotionId.equals(promotionObjectId)
  );

  const generatePromoCode = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `PC-${randomNumber}`;
  };


  if (!alreadyAdded) {
    digitalCard.promotions.push({
      promotionId: promotionObjectId,
      status: "pending", // default status
      usedAt: null,
      promoCode: generatePromoCode(),
    });
  }

  


  await digitalCard.save();

  // Populate promotion details for response
  await digitalCard.populate({
    path: "promotions.promotionId",
    model: "PromotionMercent",
  });

  // Format response
  const allPromotions = digitalCard.promotions.map((promo) => ({
    cardCode: digitalCard.cardCode,
    promoCode: promo.promoCode,
    status: promo.status,
    usedAt: promo.usedAt,
    promotion: promo.promotionId,
  }));

  return {
    totalPromotions: allPromotions.length,
    promotions: allPromotions,
  };
};

const getUserAddedPromotions = async (
  userId: string,
  query: Record<string, any>
) => {
  const { page = 1, limit = 10, searchTerm } = query;

  const pageNum = Number(page) || 1;
  const perPage = Number(limit) || 10;

  const pipeline: any[] = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },

    { $unwind: "$promotions" },

    // ❗ Skip used promotions
    {
      $match: {
        "promotions.status": { $ne: "used" }, // used promotions exclude
      },
    },

    {
      $lookup: {
        from: "promotionmercents",
        localField: "promotions.promotionId",
        foreignField: "_id",
        as: "promotion",
      },
    },
    { $unwind: "$promotion" },

    // Lookup merchant to get businessName
    {
      $lookup: {
        from: "users",
        localField: "promotion.merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },

    // Search
    searchTerm
      ? {
          $match: {
            "promotion.name": { $regex: searchTerm, $options: "i" },
          },
        }
      : { $match: {} },

    {
      $facet: {
        metadata: [{ $count: "total" }],

        data: [
          { $skip: (pageNum - 1) * perPage },
          { $limit: perPage },

          {
            $project: {
              _id: 0,
              cardCode: "$cardCode",
              status: "$promotions.status",
              usedAt: "$promotions.usedAt",
              promotion: "$promotion",
              promoCode: "$promotions.promoCode",
              merchantBusinessName: "$merchant.businessName",
            },
          },
        ],
      },
    },
  ];

  const result = await DigitalCard.aggregate(pipeline);

  const total = result[0].metadata[0]?.total || 0;
  const promotions = result[0].data;

  return {
    data: { totalPromotions: total, promotions },
    pagination: {
      total,
      page: pageNum,
      limit: perPage,
      totalPage: Math.ceil(total / perPage) || 1,
    },
  };
};

const getUserDigitalCards = async (
  userId: string,
  query: Record<string, any>
) => {
  const { searchTerm, page = 1, limit = 10 } = query;
  const pageNum = Math.max(1, Number(page));
  const perPage = Math.max(1, Number(limit));

  const baseMatch = { userId: new mongoose.Types.ObjectId(userId) };

  // pipeline before facet: match -> lookup -> unwind -> optional search
  const pipeline: any[] = [
    { $match: baseMatch },
    {
      $lookup: {
        from: "users",
        localField: "merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    // keep docs if merchant missing to avoid accidental drops
    { $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true } },
  ];

  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { cardCode: { $regex: searchTerm, $options: "i" } },
          { "merchant.businessName": { $regex: searchTerm, $options: "i" } },
          { "merchant.firstName": { $regex: searchTerm, $options: "i" } },
        ],
      },
    });
  }

  // facet to get total count AND paginated data in one query
  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [
        { $skip: (pageNum - 1) * perPage },
        { $limit: perPage },
        {
          $project: {
            _id: 1,
            userId: 1,
            cardCode: 1,
            availablePoints: 1,
            promotions: 1,
            createdAt: 1,
            updatedAt: 1,
            merchant: {
              _id: "$merchant._id",
              firstName: "$merchant.firstName",
              businessName: "$merchant.businessName",
              profile: "$merchant.profile",
            },
          },
        },
      ],
    },
  });

  // run aggregation
  const aggResult = await DigitalCard.aggregate(pipeline);

  // aggResult is an array with a single object { metadata: [...], data: [...] }
  const metadata = aggResult[0]?.metadata ?? [];
  const data = aggResult[0]?.data ?? [];

  const total = metadata[0]?.total ?? 0;
  const totalPage = Math.ceil(total / perPage) || 1;

  const formattedCards = data.map((card: any) => ({
    _id: card._id,
    userId: card.userId,
    merchantId: card.merchant,
    cardCode: card.cardCode,
    availablePoints: parseFloat((card.availablePoints ?? 0).toFixed(4)),
    promotions: Array.isArray(card.promotions)
      ? card.promotions
          .map((p: any) => p?.promotionId?.toString())
          .filter(Boolean)
      : [],
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  }));

  return {
    data: { totalDigitalCards: total, digitalCards: formattedCards },
    pagination: {
      total,
      page: pageNum,
      limit: perPage,
      totalPage,
    },
  };
};

const getPromotionsOfDigitalCard = async (digitalCardId: string) => {
  const digitalCard = await DigitalCard.findById(digitalCardId).populate(
    "promotions"
  ); // সমস্ত promotion details নিয়ে আসে

  if (!digitalCard) {
    throw new Error("Digital Card not found");
  }

  return {
    totalPromotions: digitalCard.promotions.length,
    promotions: digitalCard.promotions,
  };
};


const getMerchantDigitalCardWithPromotions = async (
  merchantId: string,
  code: string // can be digital card code OR promoCode
) => {
  console.log("=================================================");
  console.log("🚀 getMerchantDigitalCardWithPromotions START");
  console.log("🔹 Input merchantId:", merchantId);
  console.log("🔹 Input code:", code);
  console.log("=================================================");

  let searchedByPromoCode = false;
  let digitalCard: any = null;

  /* ------------------------------------------------
     1️⃣ Search by DigitalCard.cardCode
  ------------------------------------------------ */
  console.log("🔍 Step 1: Searching DigitalCard by cardCode...");

  digitalCard = await DigitalCard.findOne({
    merchantId,
    cardCode: code,
  }).populate({
    path: "promotions.promotionId",
    select:
      "name discountPercentage promotionType image startDate endDate status cardId grossValue",
  });

  console.log(
    "📌 Result of cardCode search:",
    digitalCard ? "FOUND ✅" : "NOT FOUND ❌"
  );

  /* ------------------------------------------------
     2️⃣ If not found, search by promotions.promoCode
  ------------------------------------------------ */
  if (!digitalCard) {
    searchedByPromoCode = true;
    console.log("🔍 Step 2: Searching by promoCode inside DigitalCard.promotions");

    digitalCard = await DigitalCard.findOne({
      merchantId,
      "promotions.promoCode": code,
      "promotions.status": { $in: ["pending", "unused"] },
      "promotions.usedAt": null,
    }).populate({
      path: "promotions.promotionId",
      select:
        "name discountPercentage promotionType image startDate endDate status cardId merchantId grossValue",
    });

    console.log(
      "📌 Result of promoCode search:",
      digitalCard ? "FOUND ✅" : "NOT FOUND ❌"
    );

    if (!digitalCard) {
      console.log("❌ ERROR: No DigitalCard found for promoCode:", code);
      console.log("=================================================");
      return null;
    }

    /* ------------------------------------------------
       2️⃣.1 Verify promotion ownership
    ------------------------------------------------ */
    console.log("🔐 Step 2.1: Verifying promotion ownership");

    const validPromotionIds = digitalCard.promotions
      .filter((p: any) => {
        const match = p.promoCode === code;
        console.log(
          "   ↳ Checking promoCode:",
          p.promoCode,
          "match:",
          match
        );
        return match;
      })
      .map((p: any) => p.promotionId?._id)
      .filter(Boolean);

    console.log("📌 Valid Promotion IDs from card:", validPromotionIds);

    const promotion = await Promotion.findOne({
      _id: { $in: validPromotionIds },
      merchantId,
    });

    console.log(
      "📌 Promotion ownership check:",
      promotion ? "VALID ✅" : "INVALID ❌"
    );

    if (!promotion) {
      console.log("❌ ERROR: Promotion does not belong to this merchant");
      console.log("=================================================");
      return null;
    }
  }

  /* ------------------------------------------------
     3️⃣ Final DigitalCard existence check
  ------------------------------------------------ */
  if (!digitalCard) {
    console.log("❌ ERROR: DigitalCard not found by any method");
    console.log("=================================================");
    return null;
  }

  console.log("✅ DigitalCard found:", digitalCard.cardCode);

  /* ------------------------------------------------
     4️⃣ Filter only valid promotions
  ------------------------------------------------ */
  console.log("🔍 Step 3: Filtering valid promotions");

  const validPromotions = digitalCard.promotions
    .map((item: any, index: number) => {
      console.log(`➡️ Checking promotion [${index}]`);

      if (!item.promotionId) {
        console.log("   ❌ promotionId missing");
        return null;
      }

      if (!(item.status === "pending" || item.status === "unused")) {
        console.log("   ❌ Invalid status:", item.status);
        return null;
      }

      if (item.usedAt) {
        console.log("   ❌ Already used at:", item.usedAt);
        return null;
      }

      const today = new Date();
      const startDate = new Date(item.promotionId.startDate);
      const endDate = new Date(item.promotionId.endDate);

      console.log("   📅 Date check:", {
        today,
        startDate,
        endDate,
      });

      if (today < startDate || today > endDate) {
        console.log("   ❌ Promotion expired or not started yet");
        return null;
      }

      if (searchedByPromoCode && item.promoCode !== code) {
        console.log("   ❌ promoCode mismatch:", item.promoCode);
        return null;
      }

      console.log("   ✅ Promotion VALID:", {
        promoCode: item.promoCode,
        cardId: item.promotionId.cardId,
        name: item.promotionId.name,
      });

      return {
        status: item.status,
        usedAt: item.usedAt,
        promoCode: item.promoCode,
        ...item.promotionId.toObject(),
      };
    })
    .filter(Boolean);

  console.log("📌 Total valid promotions:", validPromotions.length);

  if (validPromotions.length === 0) {
  console.log("⚠️ No active promotions found");

  // যদি promoCode দিয়ে search করা হয় → null return করবে
  if (searchedByPromoCode) {
    console.log("❌ ERROR: promoCode দেওয়া হয়েছে কিন্তু valid না");
    console.log("=================================================");
    return null;
  }

    // যদি cardCode দিয়ে search করা হয় → card return করবে
    console.log("✅ Returning card without promotions");
    
    return {
      digitalCard: {
        ...digitalCard.toObject(),
        promotions: [],
      },
    };
  }


  /* ------------------------------------------------
     5️⃣ Final response
  ------------------------------------------------ */
  console.log("✅ SUCCESS: Returning DigitalCard with promotions");
  console.log("=================================================");

  return {
    digitalCard: {
      ...digitalCard.toObject(),
      promotions: validPromotions,
    },
  };
};





export const DigitalCardService = {
  addPromotionToDigitalCard,
  getUserAddedPromotions,
  getUserDigitalCards,
  getPromotionsOfDigitalCard,
  getMerchantDigitalCardWithPromotions,
};
