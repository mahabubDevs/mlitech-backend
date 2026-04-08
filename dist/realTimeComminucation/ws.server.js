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
exports.clients = void 0;
exports.setupWebSocketServer = setupWebSocketServer;
const ws_1 = require("ws");
const notification_1 = require("./notification");
// Map share করতে চাইলে export করতে পারেন (optional)
exports.clients = new Map();
// WebSocket server setup function
function setupWebSocketServer(serverOrPort) {
    // যদি number দেন → নতুন port, যদি HTTP server দেন → attach
    const wss = typeof serverOrPort === "number"
        ? new ws_1.WebSocketServer({ port: serverOrPort })
        : new ws_1.WebSocketServer({ server: serverOrPort });
    console.log("🟢 WebSocket server running");
    wss.on("connection", (ws) => {
        ws.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
            const msg = JSON.parse(message);
            // আলাদা handler call
            if (msg.type.startsWith("notification"))
                yield (0, notification_1.notificationHandler)(ws, msg);
        }));
    });
    return wss;
}
