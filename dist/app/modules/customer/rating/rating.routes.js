"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const rating_validation_1 = require("./rating.validation");
const rating_controller_1 = require("./rating.controller");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../../middlewares/validateRequest"));
const user_1 = require("../../../../enums/user");
const router = express_1.default.Router();
//  User approves promotion → give rating
router.post("/give-rating", (0, auth_1.default)(), (0, validateRequest_1.default)(rating_validation_1.createRatingValidation), rating_controller_1.RatingController.addRating);
//  Merchant get all ratings
router.get("/merchant/:merchantId", (0, auth_1.default)(user_1.USER_ROLES.MERCENT), rating_controller_1.RatingController.getMerchantRatings);
router.get("/merchant/average-rating/:merchantId", (0, auth_1.default)(), rating_controller_1.RatingController.getMerchantAverageRating);
exports.RatingRoutes = router;
