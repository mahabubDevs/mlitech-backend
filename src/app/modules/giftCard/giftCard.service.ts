import { GiftCard, IGiftCard } from "./giftCard.model";
import { DigitalCard } from "./digitalCard.model";
import { IBuyGiftCardPayload, ICreateGiftCardPayload, IFindCustomerByCardResult } from "./giftCard.interface";
import mongoose from "mongoose";
import { User } from "../user/user.model";

function genUniqueId(prefix = "GC") {
  const fourDigits = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  const threeDigits = Math.floor(100 + Math.random() * 900);  // 100-999
  return `${prefix}-${fourDigits}-${threeDigits}`;
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


const listUserGiftCards = async (userId: string) => {
  // 1️⃣ Find all digital cards for this user
  const digitalCards = await DigitalCard.find({ userId: new mongoose.Types.ObjectId(userId) }).lean();

  if (!digitalCards.length) return [];

  const digitalCardIds = digitalCards.map(dc => dc._id);

  // 2️⃣ Fetch all gift cards for these digital cards (ignore merchant info)
  const giftCards = await GiftCard.find({ 
    digitalCardId: { $in: digitalCardIds },
    userId: new mongoose.Types.ObjectId(userId) // only those the user bought
  })
  .select("_id code points tierId expiry isActive digitalCardId") // select only necessary fields
  .lean();

  return giftCards;
};


const buyGiftCard = async (payload: { giftCardId: string, userId: string }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { giftCardId, userId } = payload;

    // GiftCard খুঁজে পাওয়া
    const giftCard = await GiftCard.findOne({ _id: new mongoose.Types.ObjectId(giftCardId) }).session(session);
    if (!giftCard) throw new Error("Gift card not found");
    if (!giftCard.isActive) throw new Error("Gift card is not active");

    const merchantId = giftCard.merchantId;

    // Buyer খুঁজে পাওয়া
    const buyer = await User.findById(new mongoose.Types.ObjectId(userId)).session(session);
    if (!buyer) throw new Error("Buyer not found");

    // DigitalCard create বা fetch করা
    const digital = await createDigitalCardIfNotExists(userId, merchantId);

    // GiftCard কে user assign + digitalCard link
    giftCard.userId = new mongoose.Types.ObjectId(userId);
    giftCard.digitalCardId = digital._id; // << important, link gift card to digital card
    await giftCard.save({ session });

    // DigitalCard update
    digital.totalPoints = (digital.totalPoints || 0) + giftCard.points;
    if (!digital.pointsHistory) digital.pointsHistory = [];
    digital.pointsHistory.push({
      points: giftCard.points,
      type: "earn",
      createdAt: new Date()
    });
    await digital.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { digitalCard: digital, giftCard };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};


const findCustomerByUniqueCardId = async (uniqueId: string): Promise<IFindCustomerByCardResult> => {
  // Digital card fetch, only required fields
  const digital = await DigitalCard.findOne({ uniqueId })
    .select("uniqueId totalPoints pointsHistory") .populate({
    path: "merchantId",
    select: "businessName photo", // merchant-er required fields
    model: "User"
  }) // fetch only these
    .lean();

  if (!digital) return { customer: null, digitalCard: null, giftCards: [] };

  // Merchant info
  // const merchant = await User.findById(digital.merchantId)
  //   .select("businessName photo") // fetch only business name and photo
  //   .lean();

  return { 
    customer: null, // customer info na lage, tai null
    digitalCard: { 
      photo: (digital as any).merchantId?.photo || null,
      businessName: (digital as any).merchantId?.businessName || null,
      uniqueId: digital.uniqueId,
      totalPoints: digital.totalPoints,
      pointsHistory: digital.pointsHistory,
      // merchantId: merchant || null
    },
    giftCards: [] // optional, na pathale empty
  };
};


const getGiftCardsByDigitalCard = async (digitalCardId: string) => {
  return GiftCard.find({ digitalCardId }).sort({ createdAt: -1 });
};

const listDigitalCardsByUser = async (userId: string) => {
  const digitalCards = await DigitalCard.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",                       // MUST be "users"
        localField: "merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },
    {
      $project: {
        _id: 0,
        uniqueId: 1,
        totalPoints: 1,
        merchantId: 1,
        merchantBusinessName: "$merchant.businessName",
        merchantLogo: "$merchant.photo",
      },
    },
  ]);

  return digitalCards;
};




const getDigitalCardWithGiftCards = async (userId: string, digitalCardId: string) => {
  const digitalCard = await DigitalCard.aggregate([
    { 
      $match: { 
        _id: new mongoose.Types.ObjectId(digitalCardId),
        userId: new mongoose.Types.ObjectId(userId)
      } 
    },
    {
      $lookup: {
        from: "users",
        localField: "merchantId",
        foreignField: "_id",
        as: "merchant",
      },
    },
    { $unwind: "$merchant" },
    {
      $lookup: {
        from: "giftcards",
        localField: "_id",
        foreignField: "digitalCardId",
        as: "giftCards",
      },
    },
    {
      $project: {
        _id: 0,
        uniqueId: 1,
        totalPoints: 1,
        merchantId: 1,
        merchantBusinessName: "$merchant.businessName",
        merchantLogo: "$merchant.photo",
        giftCards: 1,
      },
    },
  ]);

  if (!digitalCard || digitalCard.length === 0) return null;
  return digitalCard[0];
};



const createGiftCard = async (payload: ICreateGiftCardPayload) => {
  const {title, merchantId, points, expiry, code, userId, tierId } = payload;
  const giftCode = code || genUniqueId("GC");

  const giftCard = new GiftCard({
    title,
    code: giftCode,
    merchantId, // token user id
    userId: userId || null,
    tierId: tierId || null,
    digitalCardId: null,
    points,
    expiry: expiry ? new Date(expiry as any) : null,
  });

  return giftCard.save();
};

const getAllGiftCardById = () => {
  return GiftCard.find(); // Query object return
};
const getGiftCardById = async (id: string) => GiftCard.findById(id);
// Service
const updateGiftCard = async (id: string, payload: Partial<IGiftCard>) => {
  // শুধু title এবং points নিতে হবে
  const allowedUpdates: Partial<Pick<IGiftCard, "title" | "points">> = {};
  
  if (payload.title !== undefined) allowedUpdates.title = payload.title;
  if (payload.points !== undefined) allowedUpdates.points = payload.points;

  return GiftCard.findByIdAndUpdate(id, allowedUpdates, {
    new: true,
    runValidators: true,
  });
};
const deleteGiftCard = async (id: string) => GiftCard.findByIdAndDelete(id);

export const GiftCardService = {
  buyGiftCard,
  findCustomerByUniqueCardId,
  getGiftCardsByDigitalCard,
  listDigitalCardsByUser,
  listUserGiftCards,
  getDigitalCardWithGiftCards,
  createGiftCard,
  getAllGiftCardById,
  getGiftCardById,
  updateGiftCard,
  deleteGiftCard,
};
