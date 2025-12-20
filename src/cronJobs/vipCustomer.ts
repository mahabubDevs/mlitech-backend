import cron from "node-cron";

import { Types } from "mongoose";
import { MerchantCustomer } from "../app/modules/mercent/merchantCustomer/merchantCustomer.model";

cron.schedule("0 2 * * *", async () => {
    const merchants = (await MerchantCustomer.distinct("merchantId")) as Types.ObjectId[];

    if (merchants.length > 0) {
        for (const merchantId of merchants) {
            await updateMerchantVipCustomers(merchantId);
        }
    }
});


const updateMerchantVipCustomers = async (merchantId: Types.ObjectId) => {
    const result = await MerchantCustomer.aggregate([
        { $match: { merchantId } },
        { $sort: { totalSpend: -1, totalOrders: -1 } },
        {
            $group: {
                _id: null,
                ids: { $push: "$_id" },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                vipIds: {
                    $slice: [
                        "$ids",
                        { $max: [1, { $ceil: { $multiply: ["$count", 0.1] } }] },
                    ],
                },
            },
        },
    ]);

    const vipIds = result[0]?.vipIds || [];

    await MerchantCustomer.updateMany(
        { merchantId },
        { $set: { isVip: false } }
    );

    if (vipIds.length) {
        await MerchantCustomer.updateMany(
            { _id: { $in: vipIds } },
            { $set: { isVip: true } }
        );
    }
};
