"use strict";
// import axios from "axios";
// import config from "../config";
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
exports.sendOtp = void 0;
// export const sendOtp = async (phone: string, otp: string) => {
//   try {
//     const url = "https://api.veevotech.com/v3/sendsms";
//     const payload = {
//       hash: config.veevoTech.apiKey,
//       receivernum: phone,
//       sendernum: "Default",
//       textmessage: `Your OTP is ${otp}`,
//     };
//     console.log("Sending OTP to:", phone);
//     console.log("Payload:", payload);
//     const response = await axios.post(url, payload);
//     console.log("VeevoTech Response:", response.data);
//     return response.data;
//   } catch (error: any) {
//     console.error("OTP Send Error:", error.response?.data || error.message);
//     throw error;
//   }
// };
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const sendOtp = (phone, otp) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const url = "https://api.veevotech.com/v3/sendsms";
        const payload = {
            hash: config_1.default.veevoTech.apiKey,
            receivernum: phone,
            sendernum: "Default",
            textmessage: `Your OTP is ${otp}`,
        };
        console.log("Sending OTP to:", phone);
        const response = yield axios_1.default.post(url, payload);
        console.log("VeevoTech Response:", response.data);
        // 🔴 Important validation
        if (response.data.STATUS !== "SUCCESSFUL") {
            throw new Error(`SMS Failed: ${response.data.ERROR_DESCRIPTION || "Unknown error"}`);
        }
        return response.data;
    }
    catch (error) {
        console.error("OTP Send Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw error;
    }
});
exports.sendOtp = sendOtp;
