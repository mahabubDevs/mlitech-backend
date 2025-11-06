import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
const router = express.Router();

router.get(
    '/profile',
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
    UserController.getUserProfile
);
  
router.post(
    '/create-admin',
    validateRequest(UserValidation.createAdminZodSchema),
    UserController.createAdmin
);

router
    .route('/')
    .post(
        validateRequest(UserValidation.createUserZodSchema),
        UserController.createUser
    )
    .patch(
        auth(USER_ROLES.ADMIN, USER_ROLES.USER),
        fileUploadHandler(),
        validateRequest(UserValidation.updateUserZodSchema),
        UserController.updateProfile
    );

 router.get(
  '/status/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER,),
  UserController.getUserOnlineStatus
);


export const UserRoutes = router;