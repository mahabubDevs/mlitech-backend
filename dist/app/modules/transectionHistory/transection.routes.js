"use strict";
// src/app/modules/points/point.route.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransectionRoute = void 0;
const express_1 = require("express");
const transection_controller_1 = require("./transection.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
// Get transactions: all / earn / use
router.get("/transactions", (0, auth_1.default)(), transection_controller_1.PointController.getTransactions);
// Get points summary
router.get("/summary", (0, auth_1.default)(), transection_controller_1.PointController.getSummary);
exports.TransectionRoute = router;
