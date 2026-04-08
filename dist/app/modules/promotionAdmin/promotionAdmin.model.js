"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promotion = void 0;
const mongoose_1 = require("mongoose");
const promotionSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    customerReach: { type: Number, required: true },
    discountPercentage: { type: Number, required: true },
    promotionType: { type: String, required: true },
    customerSegment: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    // createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });
exports.Promotion = (0, mongoose_1.model)("Promotion", promotionSchema);
