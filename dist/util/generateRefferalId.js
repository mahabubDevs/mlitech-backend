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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUniqueReferralId = exports.generateReferralId = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../app/modules/user/user.model");
const generateReferralId = () => {
    const id = crypto_1.default.randomBytes(4).toString("hex").toUpperCase();
    // → 8 chars, A-F + 0-9
    return id;
};
exports.generateReferralId = generateReferralId;
const createUniqueReferralId = () => __awaiter(void 0, void 0, void 0, function* () {
    let referralId;
    while (true) {
        referralId = (0, exports.generateReferralId)();
        const exists = yield user_model_1.User.exists({ referralId });
        if (!exists)
            break;
    }
    return referralId;
});
exports.createUniqueReferralId = createUniqueReferralId;
