// src/routes/package.routes.ts
import { Router } from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

import { PurchaseController } from "../purchase/purchase.controller";
import { CallBundleController } from "./callBundle.controller";

const router = Router();

// CallBundle CRUD
router.post("/", auth(USER_ROLES.ADMIN), CallBundleController.createPackage);
router.get("/", auth(), CallBundleController.getAllPackages);
router.get("/:id", auth(), CallBundleController.getSinglePackage);
router.patch("/:id", auth(USER_ROLES.ADMIN), CallBundleController.updatePackage);
router.delete("/:id", auth(USER_ROLES.ADMIN), CallBundleController.deletePackage);
router.patch("/toggle/:id", auth(USER_ROLES.ADMIN), CallBundleController.togglePackage);

// Purchase
router.post("/purchase", auth(), PurchaseController.createPurchase);

export const CallBundleRoute = router;
