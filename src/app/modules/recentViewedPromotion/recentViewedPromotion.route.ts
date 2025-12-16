// role.routes.ts
import express from "express";

import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { RecentViewedPromotionController } from "./recentViewedPromotion.controller";

const router = express.Router();

router.post("/", auth(), RecentViewedPromotionController.addRecentViewed);

router.get("/", auth(), RecentViewedPromotionController.getRecentViewed);

export const RecentViewedPromotionRoutes = router;
