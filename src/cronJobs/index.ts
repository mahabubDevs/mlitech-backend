import cron from "node-cron";
import { logger } from "../shared/logger";
import { updateMerchantVipCustomersJob } from "./vipCustomer";
import { downgradeInactiveTiers } from "./updateMerchantVipCustomersJob";
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
    cron.schedule("0 02 * * *", async () => {
      try {
        logger.info("[CRON] Tier downgrade job started");
        await downgradeInactiveTiers();
        logger.info("[CRON] Tier downgrade job finished");
      } catch (error) {
        logger.error("[CRON] Tier downgrade job failed", error);
      }
    });

    logger.info("[CRON] All cron jobs registered");
  } catch (error) {
    logger.error("[CRON] Failed to initialize cron jobs", error);
  }
};
