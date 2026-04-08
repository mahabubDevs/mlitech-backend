"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = require("mongoose");
const eventSchema = new mongoose_1.Schema({
    eventName: { type: String, required: true },
    eventType: { type: String, enum: ["Unlimited Ad Time", "Unlimited Games", "Unlimited Select City", "Off APshop"], required: true },
    state: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    image: { type: String, default: null },
    selectedGame: { type: mongoose_1.Types.ObjectId, ref: "Game", default: null },
    offAPPercentage: { type: Number, default: null },
    status: { type: String, enum: ["Active", "Expired", "Scheduled"], default: "Scheduled" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
exports.Event = (0, mongoose_1.model)("Event", eventSchema);
