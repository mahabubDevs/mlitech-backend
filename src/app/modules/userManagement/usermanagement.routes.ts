import express from "express";
import { UserController } from "./usermanagement.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { authWithPageAccess } from "../../middlewares/authWithPageAccess";

const router = express.Router();

// User CRUD Admin Only
router
  .route("/")
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getAllUsers
  );

// Get Single User
router
  .route("/:id")
  .get(
    authWithPageAccess("userManagement"),
    UserController.getSingleUser
  );

// View Report
router
  .route("/:id/report")
  .get(
    authWithPageAccess("userManagement"),
    UserController.viewReport
  );

// Active / Inactive User
router
  .route("/toggle-status/:id")
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.activeInactiveUser
  );

export const UserManagementRoutes = router;
