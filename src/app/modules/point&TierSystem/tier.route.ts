import { Router } from "express";
import { TierController } from "./tier.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";


const router = Router();

router.route("/")
  .get(auth(), TierController.getTier)
  .post(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), TierController.createTier);

router.route("/:id")
  .get(auth(), TierController.getSingleTier)
  .patch(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), TierController.updateTier)
  .delete(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), TierController.deleteTier);

export const TierRoutes = router;
