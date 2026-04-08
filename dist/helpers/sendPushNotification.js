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
exports.sendPushNotification = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin")); // firebase-admin init করা আছে ধরে নিই
const sendPushNotification = (fcmToken, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fcmToken)
        return;
    const message = {
        token: fcmToken,
        notification: { title, body },
        data: data || {},
    };
    try {
        yield firebase_admin_1.default.messaging().send(message);
        console.log("Push notification sent to:", fcmToken);
    }
    catch (err) {
        console.error("Failed to send push notification:", err);
    }
});
exports.sendPushNotification = sendPushNotification;
