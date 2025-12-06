import mongoose, { Types } from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { DigitalCard } from "../giftCard/digitalCard.model";

import { GiftCard } from "../giftCard/giftCard.model";
import { ApplyRequest } from "./sellManagement.model";

const TEN_MINUTES = 1000 * 60 * 10;

// EXISTING — DIGITAL CARD + GIFT CARDS
const getDigitalCardForMerchant = async (merchantId: string, uniqueId: string) => {
  const now = new Date();

  const digitalCard = await DigitalCard.aggregate([
    {
      $match: {
        uniqueId,
        merchantId: new mongoose.Types.ObjectId(merchantId),
      },
    },
    {
      $lookup: {
        from: "giftcards",
        let: { digitalCardId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$digitalCardId", "$$digitalCardId"] },
                  { $eq: ["$isActive", true] },
                  { $or: [{ $eq: ["$expiry", null] }, { $gt: ["$expiry", now] }] },
                ],
              },
            },
          },
          { $project: { _id: 1, code: 1, points: 1 } },
        ],
        as: "giftCards",
      },
    },
    {
      $project: {
        _id: 0,
        uniqueId: 1,
        totalPoints: 1,
        merchantBusinessName: 1,
        merchantLogo: 1,
        giftCards: 1,
      },
    },
  ]);

  if (!digitalCard.length) return null;
  return digitalCard[0];
};

// 1️⃣ CREATE APPLY REQUEST
// --- service ---
// const TEN_MINUTES = 10 * 60 * 1000;

const createApplyRequest = async (userId: string, merchantId: string, payload: any) => {
  const { giftCardId, billAmount, pointsToRedeem } = payload;

  const expiresAt = new Date(Date.now() + TEN_MINUTES);

  // Redeem points calculation
  const redeemedAmount = pointsToRedeem || 0;
  const remainingBill = billAmount - redeemedAmount;
  if (remainingBill < 0) throw new Error("Redeem points exceed bill amount");

  // Earn points calculation
  const pointsEarned = Math.floor(remainingBill * 0.05);

  const applyRequest = await ApplyRequest.create({
    userId,             // ✅ assign userId
    merchantId,
    giftCardId,
    billAmount,
    pointsToRedeem: redeemedAmount,
    pointsEarned,
    remainingBill,
    expiresAt,
    status: "pending",
  });

  return {
    _id: applyRequest._id,
    userId: applyRequest.userId,
    merchantId: applyRequest.merchantId,
    giftCardId: applyRequest.giftCardId,
    billAmount: applyRequest.billAmount,
    pointsToRedeem: applyRequest.pointsToRedeem,
    pointsEarned: applyRequest.pointsEarned,
    remainingBill: applyRequest.remainingBill,
    finalAmount: remainingBill, // <-- final amount after redeem
    status: applyRequest.status,
    expiresAt: applyRequest.expiresAt,
  };
};



const getUserRequests = async (userId: string) => {
    console.log("Fetching apply requests for user:", userId);
  // Fetch all apply requests for this user
  const requests = await ApplyRequest.find({ userId: new Types.ObjectId(userId) })
    .populate("giftCardId", "code points merchantId") // gift card basic info
    .populate("merchantId", "businessName email") // merchant info
    .sort({ createdAt: -1 }); // latest first

  return requests.map(req => ({
    requestId: req._id,
    merchant: req.merchantId,
    giftCard: req.giftCardId,
    billAmount: req.billAmount,
    pointsToRedeem: req.pointsToRedeem,
    pointsEarned: req.pointsEarned,
    remainingBill: req.remainingBill,
    finalAmount: req.remainingBill,
    status: req.status,
    expiresAt: req.expiresAt,
  }));
};


// 2️⃣ USER APPROVE / DENY REQUEST
const userApproveRequest = async (userId: string, requestId: string, action: string) => {
  const req = await ApplyRequest.findById(requestId);
  if (!req) throw new ApiError(StatusCodes.NOT_FOUND, "Request not found");

  if (req.userId.toString() !== userId.toString())
    throw new ApiError(StatusCodes.FORBIDDEN, "Not allowed");

  if (action === "approve") req.status = "approved";
  else req.status = "denied";

  return await req.save();
};

// 3️⃣ MERCHANT CONFIRM
const merchantConfirmRequest = async (merchantId: string, requestId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await ApplyRequest.findById(requestId).session(session);
    if (!request) throw new Error("Apply request not found");

    if (request.merchantId.toString() !== merchantId)
      throw new Error("Not authorized to confirm this request");

    if (request.status !== "approved")
      throw new Error("User has not approved this request yet");

    // Update request status
    request.status = "merchant_confirmed";
    await request.save({ session });

    // GiftCard: mark as used
    const giftCard = await GiftCard.findById(request.giftCardId).session(session);
    if (!giftCard) throw new Error("Gift card not found");

    giftCard.isActive = false; // mark as used
    await giftCard.save({ session });

    // Update User DigitalCard points
    const digitalCard = await DigitalCard.findOne({
      userId: giftCard.userId,
      merchantId: giftCard.merchantId,
    }).session(session);

    if (digitalCard) {
      digitalCard.totalPoints = (digitalCard.totalPoints || 0) + request.pointsEarned;
      if (!digitalCard.pointsHistory) digitalCard.pointsHistory = [];

      digitalCard.pointsHistory.push({
        points: request.pointsEarned,
        type: "earn",
        description: `Points earned from gift card ${giftCard._id}`,
        createdAt: new Date(),
      });

      await digitalCard.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return {
      requestId: request._id,
      status: request.status,
      pointsEarned: request.pointsEarned,
      finalAmount: request.remainingBill,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};


export const SellManagementService = {
  getDigitalCardForMerchant,
  createApplyRequest,
  userApproveRequest,
  merchantConfirmRequest,
  getUserRequests
};
