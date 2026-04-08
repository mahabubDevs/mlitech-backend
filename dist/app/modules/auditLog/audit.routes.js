"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const audit_controller_1 = require("./audit.controller");
const router = express_1.default.Router();
router.get("/audit-logs", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), audit_controller_1.AuditController.getAuditLogs);
router.get("/audit-log/tier", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), audit_controller_1.AuditController.getAuditLogTier);
router.get("/audit-logs/user", (0, auth_1.default)(), audit_controller_1.AuditController.getAuditLogsByUser);
exports.AuditRoutes = router;
