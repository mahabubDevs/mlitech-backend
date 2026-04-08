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
exports.socketHelper = void 0;
const colors_1 = __importDefault(require("colors"));
const config_1 = __importDefault(require("../config"));
const jwtHelper_1 = require("./jwtHelper");
const user_model_1 = require("../app/modules/user/user.model");
const logger_1 = require("../shared/logger");
const socket = (io) => {
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) ||
                socket.handshake.headers.token;
            console.log(token);
            if (!token) {
                socket.emit("auth_error", "Authentication token required");
                return socket.disconnect(true);
            }
            const verifiedUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
            if (!(verifiedUser === null || verifiedUser === void 0 ? void 0 : verifiedUser.id)) {
                socket.emit("auth_error", "Invalid token");
                return socket.disconnect(true);
            }
            // attach user info to socket (very important)
            socket.data.userId = verifiedUser.id;
            yield user_model_1.User.findByIdAndUpdate(verifiedUser.id, {
                $addToSet: { socketIds: socket.id },
            });
            logger_1.logger.info(colors_1.default.blue(`User connected: ${verifiedUser.id}`));
            // এখানে connected users দেখতে চাও
            const socketsArray = Array.from(io.sockets.sockets.values());
            const connectedUsers = socketsArray.map((s) => ({
                socketId: s.id,
                userId: s.data.userId,
            }));
            console.log("💠 Current Connected Users:", connectedUsers);
            socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
                yield user_model_1.User.findByIdAndUpdate(socket.data.userId, {
                    $pull: { socketIds: socket.id },
                });
                logger_1.logger.info(colors_1.default.red(`User disconnected: ${socket.data.userId}`));
                // 3️⃣ Optionally, show all currently connected users
                const io = global.io;
                const socketsArray = Array.from(io.sockets.sockets.values());
                const connectedUsers = socketsArray.map((s) => ({
                    socketId: s.id,
                    userId: s.data.userId,
                }));
                console.log("💠 Current Connected Users after disconnect:", connectedUsers);
            }));
        }
        catch (error) {
            logger_1.logger.error(error);
            socket.emit("auth_error", "Authentication failed");
            socket.disconnect(true);
        }
    }));
};
exports.socketHelper = { socket };
