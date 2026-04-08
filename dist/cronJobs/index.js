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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../shared/logger");
const vipCustomer_1 = require("./vipCustomer");
const updateMerchantVipCustomersJob_1 = require("./updateMerchantVipCustomersJob");
const expairdSubscripon_1 = require("./expairdSubscripon");
const expairdRemaindaerSubscription_1 = require("./expairdRemaindaerSubscription");
// তোমার cron logic function
const startCronJobs = () => {
    try {
        // 🔹 VIP Customer Update → রাত ১টা
        node_cron_1.default.schedule("0 1 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                logger_1.logger.info("[CRON] VIP customer update started");
                yield (0, vipCustomer_1.updateMerchantVipCustomersJob)();
                logger_1.logger.info("[CRON] VIP customer update finished");
            }
            catch (error) {
                logger_1.logger.error("[CRON] VIP customer update failed", error);
            }
        }));
        // 🔹 Tier Downgrade → রাত ২টা
        node_cron_1.default.schedule("0 2 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                logger_1.logger.info("[CRON] Tier downgrade job started");
                yield (0, updateMerchantVipCustomersJob_1.downgradeInactiveTiers)();
                logger_1.logger.info("[CRON] Tier downgrade job finished");
            }
            catch (error) {
                logger_1.logger.error("[CRON] Tier downgrade job failed", error);
            }
        }));
        // 🔹 Subscription Expire Check → প্রতি রাত ৩টা
        node_cron_1.default.schedule("13 14 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                logger_1.logger.info("[CRON] Subscription expire job started");
                yield (0, expairdSubscripon_1.expireSubscriptionsJob)();
                logger_1.logger.info("[CRON] Subscription expire job finished");
            }
            catch (error) {
                logger_1.logger.error("[CRON] Subscription expire job failed", error);
            }
        }));
        // 🔹 Subscription Expire & Reminder → রাত ৩টা
        node_cron_1.default.schedule("20 14 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                logger_1.logger.info("[CRON] Subscription expire job started");
                yield (0, expairdRemaindaerSubscription_1.expireReminderSubscriptionsJob)(); // এখানে reminder logic থাকবে
                logger_1.logger.info("[CRON] Subscription expire job finished");
            }
            catch (error) {
                logger_1.logger.error("[CRON] Subscription expire job failed", error);
            }
        }));
        // 🔹 Pending Sell Cleanup → প্রতি মিনিটে
        // cron.schedule("* * * * *", async () => {
        //   logger.info("[CRON] Sell cleanup job running");
        //     await cleanupExpiredSells();
        // });
        logger_1.logger.info("[CRON] All cron jobs registered");
        logger_1.logger.info("[CRON] All cron jobs registered");
    }
    catch (error) {
        logger_1.logger.error("[CRON] Failed to initialize cron jobs", error);
    }
};
exports.startCronJobs = startCronJobs;
