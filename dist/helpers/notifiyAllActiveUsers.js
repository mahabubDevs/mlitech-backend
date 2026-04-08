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
exports.notifyAllActiveUsers = void 0;
const user_model_1 = require("../app/modules/user/user.model");
const user_1 = require("../enums/user");
const notificationsHelper_1 = require("./notificationsHelper");
const notifyAllActiveUsers = (_a) => __awaiter(void 0, [_a], void 0, function* ({ title, body, type, metadata, audience }) {
    const users = yield user_model_1.User.find({ role: audience === user_1.USER_ROLES.USER ? user_1.USER_ROLES.USER : user_1.USER_ROLES.MERCENT, status: user_1.USER_STATUS.ACTIVE }).select('_id');
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: users.map((u) => u._id),
        title,
        body,
        type,
        metadata,
    });
});
exports.notifyAllActiveUsers = notifyAllActiveUsers;
