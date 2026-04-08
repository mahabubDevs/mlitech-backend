"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contacUsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const contactUs_controller_1 = require("./contactUs.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
// Submit a contact message
router.post("/", (0, auth_1.default)(), contactUs_controller_1.ContactController.createContact);
// Get all contact messages (for admin)
router.get("/contact", (0, auth_1.default)(), contactUs_controller_1.ContactController.getAllContacts);
exports.contacUsRoutes = router;
