import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import fileUploadHandler from "../../middlewares/fileUploaderHandler";
import { GameController } from "./game.controller";

const router = express.Router();

// Admin routes
router.post("/", auth(USER_ROLES.ADMIN), fileUploadHandler(), GameController.createGame);
router.patch("/:id", auth(USER_ROLES.ADMIN), fileUploadHandler(), GameController.updateGame);
router.delete("/:id", auth(USER_ROLES.ADMIN), GameController.deleteGame);
router.patch("/toggle/:id", auth(USER_ROLES.ADMIN), GameController.toggleGameStatus);

// User routes
router.get("/", auth(USER_ROLES.USER, USER_ROLES.ADMIN), GameController.getGames);
router.get("/:id", auth(USER_ROLES.USER, USER_ROLES.ADMIN), GameController.getSingleGame);

export const GameRoutes = router;
