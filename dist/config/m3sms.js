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
exports.sendOtp = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const sendOtp = (phone, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const soapUrl = process.env.M3_SMS_URL;
        if (!soapUrl) {
            throw new Error("M3_SMS_URL environment variable is not set");
        }
        const msgId = (0, uuid_1.v4)();
        console.log("📨 Sending OTP SMS");
        console.log("📱 Phone:", phone);
        console.log("🔢 OTP:", otp);
        console.log("🆔 MsgId:", msgId);
        console.log("🌐 SMS URL:", soapUrl);
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SendSMS xmlns="http://tempuri.org/">
      <UserId>${process.env.M3_SMS_USER_ID}</UserId>
      <Password>${process.env.M3_SMS_PASSWORD}</Password>
      <MobileNo>${phone}</MobileNo>
      <MsgId>${msgId}</MsgId>
      <SMS>Your OTP is ${otp}</SMS>
      <MsgHeader>${process.env.M3_SMS_HEADER}</MsgHeader>
      <HandsetPort>0</HandsetPort>
      <SMSChannel>OTP</SMSChannel>
    </SendSMS>
  </soap:Body>
</soap:Envelope>`;
        console.log("📦 SOAP Request XML:\n", xml);
        const response = yield axios_1.default.post(soapUrl, xml, {
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction: "http://tempuri.org/SendSMS",
            },
            timeout: 15000,
        });
        console.log("✅ SMS API Response Status:", response.status);
        console.log("✅ SMS API Response Headers:", response.headers);
        console.log("✅ SMS API Response Data:\n", response.data);
        return response.data;
    }
    catch (error) {
        console.error("❌ OTP SMS Failed");
        if (error.response) {
            console.error("❌ Response Status:", error.response.status);
            console.error("❌ Response Data:", error.response.data);
        }
        else if (error.request) {
            console.error("❌ No response from SMS server");
        }
        else {
            console.error("❌ Error Message:", error.message);
        }
        throw error;
    }
});
exports.sendOtp = sendOtp;
