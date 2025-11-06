// src/routes/package.routes.ts
import { Router } from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

import { PurchaseController, PurchaseControllerTest } from "../purchase/purchase.controller";
import { AuraBundleController } from "./auraBundle.controller";

const router = Router();

// AuraBundle CRUD
router.post("/", auth(USER_ROLES.ADMIN), AuraBundleController.createPackage);
router.get("/", auth(), AuraBundleController.getAllPackages);
router.get("/:id", auth(), AuraBundleController.getSinglePackage);
router.patch("/:id", auth(USER_ROLES.ADMIN), AuraBundleController.updatePackage);
router.delete("/:id", auth(USER_ROLES.ADMIN), AuraBundleController.deletePackage);
router.patch("/toggle/:id", auth(USER_ROLES.ADMIN), AuraBundleController.togglePackage);

// Purchase
router.post("/purchase", auth(), PurchaseController.createPurchase);

// src/routes/package.routes.ts
router.post("/purchase/test", auth(), PurchaseControllerTest.createPurchaseTest);


export const AuraBundleRoute = router;
