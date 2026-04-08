"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageRoutes = void 0;
const express_1 = __importDefault(require("express"));
const package_controller_1 = require("./package.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const package_validation_1 = require("./package.validation");
const fileUploaderHandler_1 = __importDefault(require("../../middlewares/fileUploaderHandler"));
// import { authWithPageAccess } from "../../middlewares/authWithPageAccess";
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
router.route("/")
    .post((0, fileUploaderHandler_1.default)(), (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(package_validation_1.PackageValidation.createPackageZodSchema), package_controller_1.PackageController.createPackage)
    .get(package_controller_1.PackageController.getPackage);
router.get("/active-packages", package_controller_1.PackageController.getActivePackages);
router.route("/:id")
    .get((0, auth_1.default)(), package_controller_1.PackageController.getSinglePackage)
    .patch((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), package_controller_1.PackageController.updatePackage)
    .delete((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), package_controller_1.PackageController.deletePackage);
router.patch("/toggle/:id", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), package_controller_1.PackageController.togglePackageStatus);
exports.PackageRoutes = router;
