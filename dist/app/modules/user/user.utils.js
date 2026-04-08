"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomUserId = void 0;
const user_counter_model_1 = require("./user.counter.model");
const user_1 = require("../../../enums/user");
const generateCustomUserId = (role) => __awaiter(void 0, void 0, void 0, function* () {
    let prefix = "C";
    let counterRole = "CUSTOMER";
    if (role === user_1.USER_ROLES.MERCENT) {
        prefix = "M";
        counterRole = "MERCENT";
    }
    else if (role === user_1.USER_ROLES.ADMIN) {
        prefix = "A";
        counterRole = "ADMIN";
    }
    else if (role === user_1.USER_ROLES.SUPER_ADMIN) {
        prefix = "SA";
        counterRole = "SUPER_ADMIN";
    }
    const counter = yield user_counter_model_1.UserCounter.findOneAndUpdate({ role: counterRole }, { $inc: { seq: 1 } }, { new: true, upsert: true });
    const number = counter.seq.toString().padStart(5, "0");
    return `${prefix}_${number}`;
});
exports.generateCustomUserId = generateCustomUserId;
