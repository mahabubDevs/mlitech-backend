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
exports.firebaseHelper = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebaseSDK_json_1 = __importDefault(require("./firebaseSDK.json"));
const logger_1 = require("../shared/logger");
// Cast serviceAccount to ServiceAccount type
const serviceAccountKey = firebaseSDK_json_1.default;
// Initialize Firebase SDK (only once)
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccountKey),
    });
}
// Multiple users
const sendPushNotifications = (values) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield firebase_admin_1.default.messaging().sendEachForMulticast(values);
    logger_1.logger.info('Notifications sent successfully', res);
    return { successCount: res.successCount, failureCount: res.failureCount };
});
// Single user
const sendPushNotification = (values) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield firebase_admin_1.default.messaging().send(values);
    logger_1.logger.info('Notification sent successfully', res);
    return res; // returns message ID
});
exports.firebaseHelper = {
    sendPushNotifications,
    sendPushNotification,
};
/* Example Usage:

const message: admin.messaging.MulticastMessage = {
  notification: {
    title: `${payload.offerTitle}`,
    body: `A new offer is available for you`,
  },
  tokens: users
    .map(user => user.deviceToken)
    .filter((token): token is string => !!token), // type-safe filter
};

// send to multiple users
const result = await firebaseHelper.sendPushNotifications(message);
console.log(result.successCount, result.failureCount);

*/
