import express from "express";
import { PushController } from "./push.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { createPushZodSchema } from "./push.validation";
import validateRequest from "../../middlewares/validateRequest";


const router = express.Router();

// Admin send push
router.post("/admin/notify", auth(USER_ROLES.ADMIN), PushController.sendNotificationToAll);


// Admin get all pushes
// router.get("/all", auth(USER_ROLES.ADMIN), PushController.getAllPushes);

export const PushRoutes = router;
