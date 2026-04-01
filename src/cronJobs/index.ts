import cron from "node-cron";
import { logger } from "../shared/logger";
import { updateMerchantVipCustomersJob } from "./vipCustomer";
import { downgradeInactiveTiers } from "./updateMerchantVipCustomersJob";
import { cleanupExpiredSells } from "./cleanupExpiredSells";
import { expireSubscriptionsJob } from "./expairdSubscripon";
 // তোমার cron logic function

export const startCronJobs = () => {
  try {
    // 🔹 VIP Customer Update → রাত ১টা
    cron.schedule("0 1 * * *", async () => {
      try {
        logger.info("[CRON] VIP customer update started");
        await updateMerchantVipCustomersJob();
        logger.info("[CRON] VIP customer update finished");
      } catch (error) {
        logger.error("[CRON] VIP customer update failed", error);
      }
    });

    // 🔹 Tier Downgrade → রাত ২টা
    cron.schedule("0 2 * * *", async () => {
      try {
        logger.info("[CRON] Tier downgrade job started");
        await downgradeInactiveTiers();
        logger.info("[CRON] Tier downgrade job finished");
      } catch (error) {
        logger.error("[CRON] Tier downgrade job failed", error);
      }
    });
// 🔹 Subscription Expire Check → প্রতি রাত ৩টা
    cron.schedule("59 11 * * *", async () => {
      try {
        logger.info("[CRON] Subscription expire job started");
        await expireSubscriptionsJob();
        logger.info("[CRON] Subscription expire job finished");
      } catch (error) {
        logger.error("[CRON] Subscription expire job failed", error);
      }
    });
     // 🔹 Pending Sell Cleanup → প্রতি মিনিটে
    // cron.schedule("* * * * *", async () => {
    //   logger.info("[CRON] Sell cleanup job running");
    //     await cleanupExpiredSells();
 
    // });

    logger.info("[CRON] All cron jobs registered");

    logger.info("[CRON] All cron jobs registered");
  } catch (error) {
    logger.error("[CRON] Failed to initialize cron jobs", error);
  }
};
