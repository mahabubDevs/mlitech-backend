"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisclaimerRoutes = void 0;
const express_1 = __importDefault(require("express"));
const disclaimer_controller_1 = require("./disclaimer.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const disclaimer_validation_1 = require("./disclaimer.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
// get disclaimer by type
router.get("/:type", (0, validateRequest_1.default)(disclaimer_validation_1.DisclaimerValidations.getDisclaimerByTypeZodSchema), disclaimer_controller_1.DisclaimerController.getDisclaimerByType);
// create or update disclaimer
router.post("/", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(disclaimer_validation_1.DisclaimerValidations.createUpdateDisclaimerZodSchema), disclaimer_controller_1.DisclaimerController.createUpdateDisclaimer);
exports.DisclaimerRoutes = router;
