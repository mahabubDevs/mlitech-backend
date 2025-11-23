import QueryBuilder from "../../../util/queryBuilder";
import { IPromotion } from "./promotionAdmin.interface";
import { Promotion } from "./promotionAdmin.model";


// Create Promotion
const createPromotionToDB = async (payload: Partial<IPromotion>): Promise<IPromotion> => {
  const promotion = new Promotion(payload);
  return promotion.save();
};

// Update Promotion
const updatePromotionToDB = async (id: string, payload: Partial<IPromotion>): Promise<IPromotion | null> => {
  return Promotion.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

// Get All Promotions with QueryBuilder
const getAllPromotionsFromDB = async (query: any = {}): Promise<{ promotions: IPromotion[]; pagination: any }> => {
  const queryBuilder = new QueryBuilder(Promotion.find(), query);

  queryBuilder
    .search(['title', 'description']) // searchable fields
    .filter()
    .sort()
    .paginate()
    .fields();

  const promotions = await queryBuilder.modelQuery;
  const pagination = await queryBuilder.getPaginationInfo();

  return { pagination, promotions  };
};

// Get Single Promotion
const getSinglePromotionFromDB = async (id: string): Promise<IPromotion | null> => {
  return Promotion.findById(id);
};

// Delete Promotion
const deletePromotionFromDB = async (id: string): Promise<IPromotion | null> => {
  return Promotion.findByIdAndDelete(id);
};

// Toggle Promotion Active/Inactive
const togglePromotionInDB = async (id: string): Promise<IPromotion | null> => {
  const promotion = await Promotion.findById(id);
  if (!promotion) return null;
  promotion.isActive = !promotion.isActive;
  return promotion.save();
};

export const PromotionService = {
  createPromotionToDB,
  updatePromotionToDB,
  getAllPromotionsFromDB,
  getSinglePromotionFromDB,
  deletePromotionFromDB,
  togglePromotionInDB,
};
