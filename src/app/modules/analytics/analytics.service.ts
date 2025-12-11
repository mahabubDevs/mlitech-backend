import mongoose from "mongoose";
import { Sell } from "../mercent/mercentSellManagement/mercentSellManagement.model";
const getCustomerAnalytics = async (
  merchantId: string,
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 10
) => {
  const filter: any = {
    merchantId: new mongoose.Types.ObjectId(merchantId),
    status: "completed",
  };

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const skip = (page - 1) * limit;

  // Total count for pagination
  const total = await Sell.countDocuments(filter);

  const records = await Sell.aggregate([
    { $match: filter },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },

    {
      $project: {
        _id: 0,
        userId: "$customer._id",
        customUserId: "$customer.customUserId",
        customerName: "$customer.firstName",
        location: "$customer.address",
        subscriptionStatus: "$customer.subscription",
        date: "$createdAt",
        revenue: "$discountedBill",
        pointsAccumulated: "$pointsEarned",
        pointsRedeemed: "$pointRedeemed",
      },
    },

    { $sort: { date: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  return {
    pagination: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },

    records,
  };
};

export const AnalyticsService = { getCustomerAnalytics };
