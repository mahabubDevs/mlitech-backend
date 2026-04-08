"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const subscription_controller_1 = require("./subscription.controller");
const router = express_1.default.Router();
router.post("/create", (0, auth_1.default)(), subscription_controller_1.SubscriptionController.createSubscription);
router.post("/cancel", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), subscription_controller_1.SubscriptionController.cancelSubscription);
router.get("/", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), subscription_controller_1.SubscriptionController.subscriptions);
router.get("/details", (0, auth_1.default)(user_1.USER_ROLES.USER), subscription_controller_1.SubscriptionController.subscriptionDetails);
router.get("/:id", (0, auth_1.default)(user_1.USER_ROLES.USER), subscription_controller_1.SubscriptionController.companySubscriptionDetails);
exports.SubscriptionRoutes = router;
