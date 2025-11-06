// src/app/modules/matching/matching.route.ts
import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { MatchingController } from "./matching.controller";

const router = express.Router();

router.get(
  "/discover",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  MatchingController.discoverUsers
);


router.post(
  "/skip/:id",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  MatchingController.skipUser
);

// Get matched users list
router.get(
  "/matches",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  MatchingController.getMatchedUsers
);
// User clicks match button (pending/match)
router.post(
  "/match/:id",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  MatchingController.matchUser
);


export const MatchingRoutes = router;
