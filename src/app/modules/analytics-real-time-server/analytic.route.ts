import { Router } from "express";
import { ServerHealthController } from "./analytic.controller";
import { validateLogsQuery } from "./analytic.validation";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = Router();

router.get("/",auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ServerHealthController.getServerStatus);
router.get("/logs",auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), validateLogsQuery, ServerHealthController.getServerLogs);
router.get("/latency",auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ServerHealthController.getApiLatency);
router.get("/apierror",auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ServerHealthController.getErrorRate);



router.post("/send-metrics",auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ServerHealthController.sendMetrics);
// Get video call quality metrics
router.get("/call-metrics",auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ServerHealthController.getCallMetrics);

// Get crash-free users percentage
router.get("/crash-free",auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ServerHealthController.getCrashFreeUsers);

// Get app version distribution
router.get("/app-versions",auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ServerHealthController.getAppVersionStats);

export const ServerHealthRoutes = router;
