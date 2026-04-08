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
exports.cleanupExpiredSells = void 0;
const mercentSellManagement_model_1 = require("../app/modules/mercent/mercentSellManagement/mercentSellManagement.model");
const logger_1 = require("../shared/logger");
const cleanupExpiredSells = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const result = yield mercentSellManagement_model_1.Sell.deleteMany({
            status: { $in: ["pending", "expired"] },
            createdAt: { $lte: fiveMinutesAgo },
        });
        if (result.deletedCount && result.deletedCount > 0) {
            logger_1.logger.info(`[CRON] Deleted ${result.deletedCount} expired/pending sells`);
        }
    }
    catch (error) {
        logger_1.logger.error("[CRON] Sell cleanup failed", error);
    }
});
exports.cleanupExpiredSells = cleanupExpiredSells;
