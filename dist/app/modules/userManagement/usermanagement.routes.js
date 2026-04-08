"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManagementRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const usermanagement_controller_1 = require("./usermanagement.controller");
const router = express_1.default.Router();
router
    .route("/")
    .post((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), usermanagement_controller_1.UserController.createUser)
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), usermanagement_controller_1.UserController.getAllUsers);
router;
router.route("/merchantrole").post((0, auth_1.default)(user_1.USER_ROLES.MERCENT), usermanagement_controller_1.UserController.createUser);
router.get("/merchants/all-users", (0, auth_1.default)(), usermanagement_controller_1.UserController.getAllMerchants);
router.get("/merchants/:id", (0, auth_1.default)(), usermanagement_controller_1.UserController.getSingleMerchant);
router.patch("/merchants/:id", (0, auth_1.default)(), usermanagement_controller_1.UserController.updateMerchant);
router.delete("/merchants/:id", (0, auth_1.default)(), usermanagement_controller_1.UserController.deleteMerchant);
router.patch("/merchants/:id/toggle-status", (0, auth_1.default)(), usermanagement_controller_1.UserController.toggleMerchantStatus);
router
    .route("/merchant")
    .post((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), usermanagement_controller_1.UserController.createMerchant);
router
    .route("/:id")
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), usermanagement_controller_1.UserController.getSingleUser)
    .patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), usermanagement_controller_1.UserController.updateUser)
    .delete((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), usermanagement_controller_1.UserController.deleteUser);
// toggle active/inactive
router.patch("/toggle/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), usermanagement_controller_1.UserController.toggleUserStatus);
exports.UserManagementRoutes = router;
