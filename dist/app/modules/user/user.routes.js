"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const fileUploaderHandler_1 = __importDefault(require("../../middlewares/fileUploaderHandler"));
const router = express_1.default.Router();
router.get("/profile", (0, auth_1.default)(), user_controller_1.UserController.getUserProfile);
router.post("/create-admin", (0, validateRequest_1.default)(user_validation_1.UserValidation.createAdminZodSchema), user_controller_1.UserController.createAdmin);
router.get("/summary-counts", (0, auth_1.default)(), user_controller_1.UserController.getUserSummaryCounts);
router
    .route("/")
    .post((0, validateRequest_1.default)(user_validation_1.UserValidation.createUserZodSchema), user_controller_1.UserController.createUser)
    .patch((0, auth_1.default)(), (0, fileUploaderHandler_1.default)(), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserZodSchema), user_controller_1.UserController.updateProfile);
router.get("/status/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), user_controller_1.UserController.getUserOnlineStatus);
exports.UserRoutes = router;
