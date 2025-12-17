import express from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import { UserController } from "./usermanagement.controller";


const router = express.Router();

router
  .route("/")
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.createUser
  )
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getAllUsers
  );

  router
  .route("/merchantrole")
  .post(
    auth(USER_ROLES.MERCENT),
    UserController.createUser
  )

router
  .route("/merchant")
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.createMerchant
  );



router
  .route("/:id")
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getSingleUser
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.updateUser
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN,),
    UserController.deleteUser
  );

// toggle active/inactive
router.patch(
  "/toggle/:id",
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.toggleUserStatus
);

export const UserManagementRoutes = router;
