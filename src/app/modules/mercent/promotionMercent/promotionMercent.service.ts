import QueryBuilder from "../../../../util/queryBuilder";
import { Rating } from "../../customer/rating/rating.model";
import { IPromotion } from "./promotionMercent.interface";
import { Promotion } from "./promotionMercent.model";

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
  const queryBuilder = new QueryBuilder(Promotion.find(), query);

  queryBuilder.search(["name"]).filter().sort().paginate().fields();

  const promotions = await queryBuilder.modelQuery;
  const pagination = await queryBuilder.getPaginationInfo();

  return { pagination, promotions };
};

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
        merchant: {
          name: 1,
          email: 1,
          profile: 1,
        },
      },
    },
  ]);
  if (result.length === 0) {
    return [
      {
        _id: "demo-merchant-1",
        avgRating: 4.5,
        totalRatings: 12,
        merchant: {
          name: "Demo Merchant One",
          email: "merchant1@example.com",
          profile: "demo1.jpg",
        },
      },
      {
        _id: "demo-merchant-2",
        avgRating: 4.2,
        totalRatings: 9,
        merchant: {
          name: "Demo Merchant Two",
          email: "merchant2@example.com",
          profile: "demo2.jpg",
        },
      },
    ];
  }
  return result;
};

export const PromotionService = {
  createPromotionToDB,
  updatePromotionToDB,
  getAllPromotionsFromDB,
  getSinglePromotionFromDB,
  deletePromotionFromDB,
  togglePromotionInDB,
  getPopularMerchantsFromDB,
};
