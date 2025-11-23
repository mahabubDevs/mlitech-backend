import { GiftCard, IGiftCard } from "./giftCard.model";
import { DigitalCard } from "./digitalCard.model";
import { IBuyGiftCardPayload, ICreateGiftCardPayload, IFindCustomerByCardResult } from "./giftCard.interface";
import mongoose from "mongoose";
import { User } from "../user/user.model";

function genUniqueId(prefix = "DC") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

const createDigitalCardIfNotExists = async (userId: any, merchantId: any) => {
  let digital = await DigitalCard.findOne({ userId, merchantId });
  if (!digital) {
    digital = await DigitalCard.create({
      userId,
      merchantId,
      uniqueId: genUniqueId("DC"),
      totalPoints: 0,
    });
  }
  return digital;
};

const buyGiftCard = async (payload: IBuyGiftCardPayload) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { merchantId, userId, points, expiry, code, tierId, discount } = payload;

    const merchant = await User.findById(merchantId).session(session);
    if (!merchant) throw new Error("Merchant not found");

    const buyer = await User.findById(userId).session(session);
    if (!buyer) throw new Error("Buyer not found");

    const digital = await createDigitalCardIfNotExists(userId, merchantId);

    const giftCode = code || genUniqueId("GC");
    const giftCard = await GiftCard.create([{
      code: giftCode,
      merchantId,
      userId,
      tierId: tierId || null,
      discount: discount || null,
      digitalCardId: digital._id,
      points,
      expiry: expiry ? new Date(expiry as any) : null,
    }], { session });

    digital.totalPoints = (digital.totalPoints || 0) + points;
    if (digital.pointsHistory) {
      digital.pointsHistory.push({ points, type: "earn", createdAt: new Date() });
    }
    await digital.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { digitalCard: digital, giftCard: (giftCard as any)[0] };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const findCustomerByUniqueCardId = async (uniqueId: string): Promise<IFindCustomerByCardResult> => {
  const digital = await DigitalCard.findOne({ uniqueId }).lean();
  if (!digital) return { customer: null, digitalCard: null, giftCards: [] };

  const customer = await User.findById(digital.userId).lean();
  const giftCards = await GiftCard.find({ digitalCardId: digital._id }).lean();

  return { customer, digitalCard: digital as any, giftCards: giftCards as any };
};

const getGiftCardsByDigitalCard = async (digitalCardId: string) => {
  return GiftCard.find({ digitalCardId }).sort({ createdAt: -1 });
};

const createGiftCard = async (payload: ICreateGiftCardPayload) => {
  const { merchantId, points, expiry, code, userId, tierId, discount } = payload;
  const giftCode = code || genUniqueId("GC");

  const giftCard = new GiftCard({
    code: giftCode,
    merchantId, // token user id
    userId: userId || null,
    tierId: tierId || null,
    discount: discount || null,
    digitalCardId: null,
    points,
    expiry: expiry ? new Date(expiry as any) : null,
  });

  return giftCard.save();
};

const getGiftCardById = async (id: string) => GiftCard.findById(id);
const updateGiftCard = async (id: string, payload: Partial<IGiftCard>) => GiftCard.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
const deleteGiftCard = async (id: string) => GiftCard.findByIdAndDelete(id);

export const GiftCardService = {
  buyGiftCard,
  findCustomerByUniqueCardId,
  getGiftCardsByDigitalCard,
  createGiftCard,
  getGiftCardById,
  updateGiftCard,
  deleteGiftCard,
};
