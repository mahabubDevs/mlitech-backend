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
exports.notificationClients = void 0;
exports.notificationHandler = notificationHandler;
exports.sendNotification = sendNotification;
exports.broadcastNotification = broadcastNotification;
const ws_1 = __importDefault(require("ws"));
// clients map share করতে পারেন chat থেকে অথবা আলাদা
exports.notificationClients = new Map();
// Incoming notification events
function notificationHandler(ws, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = msg.data) === null || _a === void 0 ? void 0 : _a.userId;
        // Authentication (optional, similar chat-auth)
        if (msg.type === "notification-auth") {
            if (!userId) {
                ws.send(JSON.stringify({ type: "error", data: "UserId missing" }));
                ws.close();
                return;
            }
            exports.notificationClients.set(userId, ws);
            ws.send(JSON.stringify({ type: "connected", data: "Notification connected" }));
            console.log("🔔 User connected for notifications:", userId);
            return;
        }
        // Example: send test notification
        if (msg.type === "notification-test") {
            ws.send(JSON.stringify({ type: "notification", data: { message: "Test notification!" } }));
        }
    });
}
// Helper to send notification to a user
function sendNotification(userId, payload) {
    const ws = exports.notificationClients.get(userId);
    if (ws && ws.readyState === ws_1.default.OPEN) {
        ws.send(JSON.stringify({ type: "notification", data: payload }));
    }
}
// Broadcast notification to all connected users
function broadcastNotification(payload) {
    for (const ws of exports.notificationClients.values()) {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify({ type: "notification", data: payload }));
        }
    }
}
