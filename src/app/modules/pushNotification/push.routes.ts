import express from "express";
import { PushController } from "./push.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { createPushZodSchema } from "./push.validation";
import validateRequest from "../../middlewares/validateRequest";
import fileUploadHandler from "../../middlewares/fileUploaderHandler";


const router = express.Router();

// Admin send push
router.post("/admin/notify", auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), PushController.sendNotificationToAll);
// Merchant send promotion push
router.post(
  "/merchant/notify",
  auth(USER_ROLES.MERCENT,USER_ROLES.ADMIN_MERCENT),
  fileUploadHandler(), // multer for image
  PushController.sendMerchantPromotion
)

// Admin get all pushes
// router.get("/all", auth(USER_ROLES.ADMIN), PushController.getAllPushes);

export const PushRoutes = router;


