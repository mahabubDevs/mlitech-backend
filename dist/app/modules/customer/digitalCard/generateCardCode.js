"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCardCode = void 0;
const generateCardCode = () => {
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6 digit
    return `DG-${randomNumber}`;
};
exports.generateCardCode = generateCardCode;
