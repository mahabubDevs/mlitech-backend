import express from "express";
import auth from "../../middlewares/auth";

import { NotificationController } from "./notification.controller";
const router = express.Router();

router.get("/", auth(), NotificationController.getMyNotification);
router.patch("/read", auth(), NotificationController.readMyNotifications);
router.post("/test", auth(), NotificationController.sendTestNotification);

export const NotificationRoutes = router;
