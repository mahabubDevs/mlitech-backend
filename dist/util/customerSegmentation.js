"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCustomerIdsBySegment = void 0;
const mercentSellManagement_model_1 = require("../app/modules/mercent/mercentSellManagement/mercentSellManagement.model");
const user_1 = require("../enums/user");
const merchantCustomer_model_1 = require("../app/modules/mercent/merchantCustomer/merchantCustomer.model");
const resolveCustomerIdsBySegment = (_a) => __awaiter(void 0, [_a], void 0, function* ({ merchantId, segment, minPoints, radiusKm, merchantLocation, }) {
    /* ---------- VIP / ALL ---------- */
    if (segment === user_1.CUSTOMER_SEGMENT.VIP_CUSTOMER) {
        return merchantCustomer_model_1.MerchantCustomer.find({ merchantId, isVip: true })
            .select("customerId");
    }
    if (segment === user_1.CUSTOMER_SEGMENT.ALL_CUSTOMER) {
        return merchantCustomer_model_1.MerchantCustomer.find({ merchantId })
            .select("customerId");
    }
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const pipeline = [
        /* ---------- BASE SELL ---------- */
        {
            $match: {
                merchantId,
                status: "completed",
            },
        },
        /* ---------- GROUP PER CUSTOMER ---------- */
        {
            $group: {
                _id: "$userId",
                purchaseCount: { $sum: 1 },
                totalSpend: { $sum: "$totalBill" },
                lastPurchaseAt: { $max: "$createdAt" },
            },
        },
        /* ---------- SEGMENT LOGIC ---------- */
        ...(segment === user_1.CUSTOMER_SEGMENT.NEW_CUSTOMER
            ? [{
                    $match: {
                        purchaseCount: { $lte: 1 },
                        lastPurchaseAt: { $gte: thirtyDaysAgo },
                    },
                }]
            : []),
        ...(segment === user_1.CUSTOMER_SEGMENT.RETURNING_CUSTOMER
            ? [{
                    $match: {
                        purchaseCount: { $gte: 2, $lt: 5 },
                    },
                }]
            : []),
        ...(segment === user_1.CUSTOMER_SEGMENT.LOYAL_CUSTOMER
            ? [{
                    $match: {
                        purchaseCount: { $gte: 5 },
                        lastPurchaseAt: { $gte: sixMonthsAgo },
                    },
                }]
            : []),
        /* ---------- JOIN MERCHANT CUSTOMER ---------- */
        {
            $lookup: {
                from: "merchantcustomers",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$customerId", "$$userId"] },
                                    { $eq: ["$merchantId", merchantId] },
                                ],
                            },
                        },
                    },
                ],
                as: "merchantCustomer",
            },
        },
        { $unwind: "$merchantCustomer" },
        /* ---------- POINT FILTER (PER MERCHANT) ---------- */
        ...(minPoints
            ? [{
                    $match: {
                        "merchantCustomer.points": { $gte: minPoints },
                    },
                }]
            : []),
        /* ---------- JOIN USER (GEO) ---------- */
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        /* ---------- GEO FILTER ---------- */
        ...(radiusKm && merchantLocation
            ? [{
                    $match: {
                        "user.location": {
                            $geoWithin: {
                                $centerSphere: [
                                    [merchantLocation.lng, merchantLocation.lat],
                                    radiusKm / 6378.1,
                                ],
                            },
                        },
                    },
                }]
            : []),
        /* ---------- OUTPUT ---------- */
        {
            $project: {
                _id: "$_id",
            },
        },
    ];
    return mercentSellManagement_model_1.Sell.aggregate(pipeline);
});
exports.resolveCustomerIdsBySegment = resolveCustomerIdsBySegment;
