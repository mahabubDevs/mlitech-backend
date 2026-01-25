import express from "express";
import auth from "../../middlewares/auth";

import { NotificationController } from "./notification.controller";
import { canAccessMerchantProfile } from "../../middlewares/accessMerchentProfile";
const router = express.Router();

router.get("/", auth(),canAccessMerchantProfile, NotificationController.getMyNotification);
router.patch("/read", auth(), NotificationController.readMyNotifications);
router.post("/test", auth(), NotificationController.sendTestNotification);
router.post("/sales-rep-active-test", auth(), NotificationController.sendSalesRepActiveTestNotification);

export const NotificationRoutes = router;
