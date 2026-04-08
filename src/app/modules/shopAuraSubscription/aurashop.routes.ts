// src/routes/package.routes.ts
import { Router } from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { AuraSubscriptionController } from "./aurashop.controller";



const router = Router();

// router.post("/", auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), AuraSubscriptionController.createPackage);

router.get("/", auth(), AuraSubscriptionController.getAllPackages);
router.patch("/:id", auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), AuraSubscriptionController.updatePackage);
router.delete("/:id", auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), AuraSubscriptionController.deletePackage);
router.patch("/toggle/:id", auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN), AuraSubscriptionController.togglePackage);
router.get("/:id", auth(), AuraSubscriptionController.getSinglePackage);

export  const AurashopRoute = router;
