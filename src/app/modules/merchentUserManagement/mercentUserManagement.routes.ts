import express from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import { MercentUserManagementController } from "./mercentUserManagement.controller";


const router = express.Router();

// ---------------- Create User ----------------
router.post(
  "/merchant/create-user",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MercentUserManagementController.createUser
);

// ---------------- Get All Users (merchant's own) ----------------
router.get(
  "/merchant/users",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MercentUserManagementController.getMyUsers
);

// ---------------- Get Single User ----------------
router.get(
  "/merchant/users/:id",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MercentUserManagementController.getSingleUser
);

// ---------------- Update User ----------------
router.put(
  "/merchant/users/:id",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MercentUserManagementController.updateUser
);

// ---------------- Delete User ----------------
router.delete(
  "/merchant/users/:id",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MercentUserManagementController.deleteUser
);

// ---------------- Toggle Active / Inactive ----------------
router.patch(
  "/merchant/users/:id/toggle-status",
  auth(USER_ROLES.MERCENT, USER_ROLES.ADMIN),
  MercentUserManagementController.toggleUserStatus
);

export default router;
