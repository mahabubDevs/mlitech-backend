import express from "express";
import { PackageController } from "./package.controller";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { PackageValidation } from "./package.validation";
import fileUploadHandler from "../../middlewares/fileUploaderHandler";
import { authWithPageAccess } from "../../middlewares/authWithPageAccess";

const router = express.Router();

router.route("/")
    .post(
        fileUploadHandler(),
        auth(),
        validateRequest(PackageValidation.createPackageZodSchema),
        PackageController.createPackage
    )
    .get(PackageController.getPackage);

router.route("/:id")
    .patch(authWithPageAccess('package'), PackageController.updatePackage)
    .delete(authWithPageAccess('package'), PackageController.deletePackage);

export const PackageRoutes = router;
