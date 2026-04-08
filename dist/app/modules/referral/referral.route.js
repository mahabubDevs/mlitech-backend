"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const referral_controller_1 = require("./referral.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const referral_validation_1 = require("./referral.validation");
const router = express_1.default.Router();
router.get("/mine", (0, auth_1.default)(), referral_controller_1.ReferralController.getMyReferredUser);
router.post("/verify-referral", (0, validateRequest_1.default)(referral_validation_1.ReferralValidation.verifyReferralZodSchema), referral_controller_1.ReferralController.verifyReferral);
exports.ReferralRoutes = router;
