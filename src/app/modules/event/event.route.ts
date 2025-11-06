import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { EventController } from "./event.controller";

import { createEventZodSchema } from "./event.validation";
import fileUploadHandler from "../../middlewares/fileUploaderHandler";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.post("/", auth(USER_ROLES.ADMIN), fileUploadHandler(),  EventController.createEvent);
router.patch("/:id", auth(USER_ROLES.ADMIN), fileUploadHandler(), EventController.updateEvent);
router.delete("/:id", auth(USER_ROLES.ADMIN), EventController.deleteEvent);
router.patch("/toggle/:id", auth(USER_ROLES.ADMIN), EventController.toggleEventStatus);
router.get("/", auth(USER_ROLES.USER, USER_ROLES.ADMIN), EventController.getEvents);
router.get(
  "/:id",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  EventController.getSingleEvent
);


export const EventRoutes = router;
