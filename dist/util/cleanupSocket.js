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
exports.cleanupStaleSockets = void 0;
const user_model_1 = require("../app/modules/user/user.model");
const cleanupStaleSockets = (io) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running cleanup of stale sockets...");
    const sockets = yield io.fetchSockets();
    const activeSocketIds = sockets.map(s => s.id);
    yield user_model_1.User.updateMany({}, { $pull: { socketIds: { $nin: activeSocketIds } } });
});
exports.cleanupStaleSockets = cleanupStaleSockets;
