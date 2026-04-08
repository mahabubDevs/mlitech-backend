"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushRoutes = void 0;
const express_1 = __importDefault(require("express"));
const push_controller_1 = require("./push.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const fileUploaderHandler_1 = __importDefault(require("../../middlewares/fileUploaderHandler"));
const router = express_1.default.Router();
// Admin send push
router.post("/admin/notify", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), push_controller_1.PushController.sendNotificationToAll);
// Merchant send promotion push
router.post("/merchant/notify", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), (0, fileUploaderHandler_1.default)(), // multer for image
push_controller_1.PushController.sendMerchantPromotion);
// Admin get all pushes - for admin dashboard
// router.get("/all", auth(USER_ROLES.ADMIN), PushController.getAllPushes);
exports.PushRoutes = router;
