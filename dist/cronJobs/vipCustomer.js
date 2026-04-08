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
exports.updateMerchantVipCustomersJob = void 0;
const merchantCustomer_model_1 = require("../app/modules/mercent/merchantCustomer/merchantCustomer.model");
const logger_1 = require("../shared/logger");
const updateMerchantVipCustomersJob = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const merchants = (yield merchantCustomer_model_1.MerchantCustomer.distinct("merchantId"));
        for (const merchantId of merchants) {
            try {
                yield updateMerchantVipCustomers(merchantId);
            }
            catch (error) {
                logger_1.logger.error(`[CRON] Failed to update VIP customers for merchant ${merchantId}`, error);
            }
        }
    }
    catch (error) {
        logger_1.logger.error("[CRON] Failed to fetch merchant list", error);
        throw error;
    }
});
exports.updateMerchantVipCustomersJob = updateMerchantVipCustomersJob;
const updateMerchantVipCustomers = (merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield merchantCustomer_model_1.MerchantCustomer.aggregate([
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
                        {
                            $max: [
                                1,
                                { $ceil: { $multiply: ["$count", 0.1] } },
                            ],
                        },
                    ],
                },
            },
        },
    ]);
    const vipIds = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.vipIds) || [];
    yield merchantCustomer_model_1.MerchantCustomer.updateMany({ merchantId }, { $set: { isVip: false } });
    if (vipIds.length) {
        yield merchantCustomer_model_1.MerchantCustomer.updateMany({ _id: { $in: vipIds } }, { $set: { isVip: true } });
    }
});
