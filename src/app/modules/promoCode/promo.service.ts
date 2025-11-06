import { Promo } from "./promo.model";
import { ICreatePromo, IUpdatePromo, IPromoDB, IApplyPromo, IAppliedPromoResult } from "./promo.interface";
import QueryBuilder from "../../../util/queryBuilder";

// Helper: convert Mongoose document to IPromoDB
const mapPromoDocToIPromoDB = (doc: any): IPromoDB => ({
  _id: doc._id.toString(),
  promoCode: doc.promoCode,
  discountType: doc.discountType,
  value: doc.value,
  usageLimit: doc.usageLimit,
  usedCount: doc.usedCount,
  startDate: doc.startDate,
  endDate: doc.endDate,
  image: doc.image || null,
  isActive: doc.isActive,
  createdBy: doc.createdBy.toString(),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Admin create
const createPromoInDB = async (payload: ICreatePromo): Promise<IPromoDB> => {
  const doc = await Promo.create(payload);
  return mapPromoDocToIPromoDB(doc);
};

// Admin update
const updatePromoInDB = async (promoId: string, payload: IUpdatePromo): Promise<IPromoDB> => {
  // discountType validation (optional)
  if (payload.discountType && payload.value !== undefined) {
    if (payload.discountType === "Percentage Discount" && (payload.value <= 0 || payload.value > 100)) {
      throw new Error("Percentage must be between 1 and 100");
    }
    if (payload.discountType === "Fixed Amount Discount" && payload.value <= 0) {
      throw new Error("Fixed amount must be greater than 0");
    }
    if ((payload.discountType === "Free Ap" || payload.discountType === "Aura+Trail Day's") && ![200, 500].includes(payload.value)) {
      throw new Error("For Free Ap / Trail, value must be 200 or 500");
    }
  }

  const doc = await Promo.findByIdAndUpdate(promoId, payload, { new: true, runValidators: true });
  if (!doc) throw new Error("Promo not found");
  return mapPromoDocToIPromoDB(doc);
};

// Admin delete
const deletePromoFromDB = async (promoId: string): Promise<IPromoDB> => {
  const doc = await Promo.findByIdAndDelete(promoId);
  if (!doc) throw new Error("Promo not found");
  return mapPromoDocToIPromoDB(doc);
};

// Admin toggle active/inactive
const togglePromoStatusInDB = async (promoId: string) => {
  const doc = await Promo.findById(promoId);
  if (!doc) throw new Error("Promo not found");
  doc.isActive = !doc.isActive;
  await doc.save();
  return { id: doc._id.toString(), isActive: doc.isActive };
};

// Get all promos (Admin/User)
const getPromosFromDB = async (query: any) => {
  const baseQuery = Promo.find({});
  const qb = new QueryBuilder(baseQuery, query);
  qb.search(["promoCode", "discountType"]).filter().sort().paginate().fields();

  const docs = await qb.modelQuery.lean();
  const data = docs.map((doc: any) => ({
    ...doc,
    _id: doc._id.toString(),
    createdBy: doc.createdBy.toString(),
  }));
  const pagination = await qb.getPaginationInfo();
  return { data, pagination };
};

// Get single promo by ID
const getSinglePromoFromDB = async (promoId: string): Promise<IPromoDB> => {
  const doc = await Promo.findById(promoId);
  if (!doc) throw new Error("Promo not found");
  return mapPromoDocToIPromoDB(doc);
};

// User apply promo
const applyPromoCode = async (payload: IApplyPromo): Promise<IAppliedPromoResult> => {
  const promo = await Promo.findOne({ promoCode: payload.promoCode });
  if (!promo) throw new Error("Promo code not found");
  if (!promo.isActive) throw new Error("Promo code is inactive");

  const now = new Date();
  if (now < promo.startDate || now > promo.endDate) throw new Error("Promo code expired");
  if (promo.usedCount >= promo.usageLimit) throw new Error("Promo usage limit reached");

  // increment usage count
  promo.usedCount += 1;
  await promo.save();

  return { promoCode: promo.promoCode, discount: { type: promo.discountType, value: promo.value } };
};

export const PromoService = {
  createPromoInDB,
  updatePromoInDB,
  deletePromoFromDB,
  togglePromoStatusInDB,
  getPromosFromDB,
  getSinglePromoFromDB,
  applyPromoCode,
};
