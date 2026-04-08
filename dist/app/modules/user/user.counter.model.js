"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCounter = void 0;
const mongoose_1 = require("mongoose");
const counterSchema = new mongoose_1.Schema({
    role: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
});
exports.UserCounter = (0, mongoose_1.model)("UserCounter", counterSchema);
