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
exports.DisclaimerServices = void 0;
const disclaimer_model_1 = require("./disclaimer.model");
const notifiyAllActiveUsers_1 = require("../../../helpers/notifiyAllActiveUsers");
const notification_model_1 = require("../notification/notification.model");
const disclaimer_notification_config_1 = require("./disclaimer.notification.config");
// create or update disclaimer
const createUpdateDisclaimer = (payload, user) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield disclaimer_model_1.Disclaimer.findOneAndUpdate({ type: payload.type }, { $set: payload }, { new: true, upsert: true });
    const notificationConfig = disclaimer_notification_config_1.DISCLAIMER_NOTIFICATION_MAP[payload.type];
    if (notificationConfig) {
        yield (0, notifiyAllActiveUsers_1.notifyAllActiveUsers)({
            title: notificationConfig.title,
            body: notificationConfig.body,
            type: notification_model_1.NotificationType.POLICY,
            audience: notificationConfig.audience,
        });
    }
    return result;
});
// get all disclaimer
const getAllDisclaimer = (type) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield disclaimer_model_1.Disclaimer.findOne({ type });
    return result;
});
exports.DisclaimerServices = { createUpdateDisclaimer, getAllDisclaimer };
