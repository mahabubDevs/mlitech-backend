"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const notification_controller_1 = require("./notification.controller");
const accessMerchentProfile_1 = require("../../middlewares/accessMerchentProfile");
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(), accessMerchentProfile_1.canAccessMerchantProfile, notification_controller_1.NotificationController.getMyNotification);
router.patch("/read", (0, auth_1.default)(), notification_controller_1.NotificationController.readMyNotifications);
router.post("/test", (0, auth_1.default)(), notification_controller_1.NotificationController.sendTestNotification);
router.post("/sales-rep-active-test", (0, auth_1.default)(), notification_controller_1.NotificationController.sendSalesRepActiveTestNotification);
exports.NotificationRoutes = router;
