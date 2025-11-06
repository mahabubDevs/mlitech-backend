import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { ChatController } from "./chat.controller";

const router = express.Router();

router.get(
  "/:userId",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  ChatController.fetchChats
);

router.get(
  "/recent/:userId",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  ChatController.recentChats
);

router.get(
  "/unread/:userId",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  ChatController.unreadCount
);

export const ChatRoutes = router;
