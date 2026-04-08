"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const favorite_validation_1 = require("./favorite.validation");
const favorite_controller_1 = __importDefault(require("./favorite.controller"));
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../../middlewares/validateRequest"));
const router = express_1.default.Router();
// ⭐ Add favorite merchant
router.post("/add", (0, auth_1.default)(), (0, validateRequest_1.default)(favorite_validation_1.addFavoriteValidation), favorite_controller_1.default.addFavorite);
// ⭐ Get all favorite merchants
router.get("/my-favorites", (0, auth_1.default)(), favorite_controller_1.default.getFavorites);
// ⭐ Remove favorite merchant
router.delete("/remove/:merchantId", (0, auth_1.default)(), favorite_controller_1.default.removeFavorite);
exports.FavoriteRoutes = router;
