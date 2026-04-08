"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercentUserManagement = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const mercentUserManagement_controller_1 = require("./mercentUserManagement.controller");
const router = express_1.default.Router();
// ---------------- Create User ----------------
router.post("/create-user", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), mercentUserManagement_controller_1.MercentUserManagementController.createUser);
// ---------------- Get All Users (merchant's own) ----------------
router.get("/users", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN_MERCENT), mercentUserManagement_controller_1.MercentUserManagementController.getMyUsers);
// ---------------- Get Single User ----------------
router.get("/users/:id", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN), mercentUserManagement_controller_1.MercentUserManagementController.getSingleUser);
// ---------------- Update User ----------------
router.patch("/users/:id", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN), mercentUserManagement_controller_1.MercentUserManagementController.updateUser);
// ---------------- Delete User ----------------
router.delete("/users/:id", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN), mercentUserManagement_controller_1.MercentUserManagementController.deleteUser);
// ---------------- Toggle Active / Inactive ----------------
router.patch("/users/toggle-status/:id", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.ADMIN), mercentUserManagement_controller_1.MercentUserManagementController.toggleUserStatus);
exports.MercentUserManagement = router;
