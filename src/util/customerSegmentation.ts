import { Types } from "mongoose";
import { Sell } from "../app/modules/mercent/mercentSellManagement/mercentSellManagement.model";
import { User } from "../app/modules/user/user.model";
import { CUSTOMER_SEGMENT } from "../enums/user";
import { MerchantCustomer } from "../app/modules/mercent/merchantCustomer/merchantCustomer.model";


export const resolveCustomerIdsBySegment = async ({
    merchantId,
    segment,
    minPoints,
    radiusKm,
    merchantLocation,
}: {
    merchantId: Types.ObjectId;
    segment: CUSTOMER_SEGMENT
    minPoints?: number;
    radiusKm?: number;
    merchantLocation?: { lng: number; lat: number };
}) => {
    const now = new Date();

    /* ---------- BASE: customers who transacted ---------- */
    const customerIds = await Sell.distinct("userId", {
        merchantId,
        status: "completed",
    });

    let match: any = { _id: { $in: customerIds } };

    /* ---------- POINT FILTER ---------- */
    if (minPoints) {
        match.loyaltyPoints = { $gte: minPoints };
    }

    /* ---------- GEO FILTER ---------- */
    if (radiusKm && merchantLocation) {
        match.location = {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [merchantLocation.lng, merchantLocation.lat],
                },
                $maxDistance: radiusKm * 1000,
            },
        };
    }

    /* ---------- SEGMENT FILTER ---------- */
    if (segment === CUSTOMER_SEGMENT.NEW) {
        const since = new Date(now.setDate(now.getDate() - 30));
        match.createdAt = { $gte: since };

        const buyers = await Sell.aggregate([
            { $match: { merchantId, status: "completed" } },
            { $group: { _id: "$userId", count: { $sum: 1 } } },
            { $match: { count: { $lte: 1 } } },
        ]);

        match._id = { $in: buyers.map(b => b._id) };
    }

    if (segment === CUSTOMER_SEGMENT.RETURNING) {
        const buyers = await Sell.aggregate([
            { $match: { merchantId, status: "completed" } },
            { $group: { _id: "$userId", count: { $sum: 1 } } },
            { $match: { count: { $gte: 2, $lt: 5 } } },
        ]);

        match._id = { $in: buyers.map(b => b._id) };
    }

    if (segment === CUSTOMER_SEGMENT.LOYAL) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const loyal = await Sell.aggregate([
            { $match: { merchantId, status: "completed", createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: "$userId", count: { $sum: 1 }, spend: { $sum: "$totalBill" } } },
            { $match: { count: { $gte: 5 } } },
        ]);

        match._id = { $in: loyal.map(l => l._id) };
    }

    if (segment === CUSTOMER_SEGMENT.VIP) {
        return await MerchantCustomer.find({
            merchantId,
            isVip: true,
        }).select("customerId");
    }

    return User.find(match).select("_id");
};
