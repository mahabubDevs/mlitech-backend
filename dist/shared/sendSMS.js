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
const twilio_1 = __importDefault(require("twilio"));
const config_1 = __importDefault(require("../config"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const client = (0, twilio_1.default)(config_1.default.twilio.accountSid, config_1.default.twilio.authToken);
const sendSMS = (to, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.messages.create({
            body: message,
            from: config_1.default.twilio.twilioNumber,
            to: to,
        });
        return {
            invalid: false,
            message: `Message sent successfully to ${to}`,
        };
    }
    catch (error) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send sms');
    }
});
exports.default = sendSMS;
