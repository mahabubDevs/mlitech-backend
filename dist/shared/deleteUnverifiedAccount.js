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
exports.deleteUnverifiedAccount = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const user_model_1 = require("../app/modules/user/user.model");
const logger_1 = require("../shared/logger");
const deleteUnverifiedAccount = () => {
    const GRACE_PERIOD_MINUTES = 5;
    node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const cutoffDate = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);
            // Delete unverified accounts older than the grace period
            const result = yield user_model_1.User.deleteMany({
                verified: false,
                createdAt: { $lt: cutoffDate }, // Only delete accounts created before the cutoff date
            });
            logger_1.logger.info(`Deleted ${result.deletedCount} unverified accounts.`);
        }
        catch (error) {
            logger_1.logger.error("Error during unverified account cleanup:", error);
        }
    }));
    logger_1.logger.info("Unverified account cleanup job scheduled to run every minute.");
};
exports.deleteUnverifiedAccount = deleteUnverifiedAccount;
