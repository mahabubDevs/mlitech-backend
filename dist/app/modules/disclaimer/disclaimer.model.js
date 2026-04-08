"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Disclaimer = void 0;
const mongoose_1 = require("mongoose");
const disclaimer_constants_1 = require("./disclaimer.constants");
const disclaimerSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: Object.values(disclaimer_constants_1.DisclaimerTypes),
    },
    content: { type: String, required: true },
}, { timestamps: true });
exports.Disclaimer = (0, mongoose_1.model)('Disclaimer', disclaimerSchema);
