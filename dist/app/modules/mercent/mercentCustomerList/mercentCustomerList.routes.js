"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercentCustomerListRoutes = void 0;
const express_1 = require("express"); // <-- express থেকে Router import করো
const user_1 = require("../../../../enums/user");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const mercentCustomerList_controller_1 = require("./mercentCustomerList.controller");
// import { mercentCustomerListController } from "./mercentCustomerList.controller";
const router = (0, express_1.Router)(); // 
// all members
router.get("/members", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), mercentCustomerList_controller_1.MemberController.getAllMembers);
// single member
router.get("/members/:userId", (0, auth_1.default)(user_1.USER_ROLES.MERCENT, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.ADMIN), mercentCustomerList_controller_1.MemberController.getSingleMember);
router.get("/customers/:id/tier", (0, auth_1.default)(user_1.USER_ROLES.MERCENT), mercentCustomerList_controller_1.MemberController.getSingleMemberTier);
exports.MercentCustomerListRoutes = router;
