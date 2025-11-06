// wsServer.ts
import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { Room } from "../app/modules/chat/chat.roommodel";
import { Chat } from "../app/modules/chat/chat.model";
import { ServerHealthService } from "../app/modules/analytics-real-time-server/analytic.service";

interface JwtUserPayload {
  id: string;
}

interface WSMessage {
  type: string;
  data: any;
}

// Map to store connected clients: userId -> WebSocket
const clients = new Map<string, WebSocket>();

export function setupWebSocket(port: number) {
  const wss = new WebSocketServer({ port });
  // console.log(`🟢 WebSocket server running on port ${port}`);

  wss.on("connection", (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on("message", async (message: string) => {
      try {
        const msg: WSMessage = JSON.parse(message);

        // 🔹 Auth
        if (msg.type === "auth") {
          const token = msg.data?.token;
          if (!token) {
            ws.send(JSON.stringify({ type: "error", data: "Token missing" }));
            ws.close();
            return;
          }

          try {
            const user = jwt.verify(token, process.env.JWT_SECRET!) as JwtUserPayload;
            userId = user.id;
            clients.set(userId, ws);

            // Broadcast online status
            broadcastOnlineStatus(userId, true);

            ws.send(JSON.stringify({ type: "connected", data: "Authenticated" }));
            console.log("🔗 User connected:", userId);
          } catch {
            ws.send(JSON.stringify({ type: "error", data: "Invalid token" }));
            ws.close();
          }
        }

        // 🔹 Send chat message
        else if (msg.type === "message") {
          if (!userId) return;
          const { receiverId, message: text, images } = msg.data;
          if (!receiverId || !text) return;

          let room = await Room.findOne({
            $or: [
              { senderId: userId, receiverId },
              { senderId: receiverId, receiverId: userId },
            ],
          });
          if (!room) room = await Room.create({ senderId: userId, receiverId });

          const chat = await Chat.create({
            roomId: room._id,
            senderId: userId,
            receiverId,
            message: text,
            images: images || [],
          });

          const receiverSocket = clients.get(receiverId);
          if (receiverSocket?.readyState === WebSocket.OPEN) {
            receiverSocket.send(JSON.stringify({ type: "message", data: chat }));
          }

          ws.send(JSON.stringify({ type: "message", data: chat }));
        }

        // 🔹 Unread messages
        else if (msg.type === "unreadMessages") {
          if (!userId) return;

          const rooms = await Room.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
          });

          let totalUnread = 0;
          for (const room of rooms) {
            const unread = await Chat.countDocuments({
              roomId: room._id,
              isRead: false,
              receiverId: userId,
            });
            totalUnread += unread;
          }

          ws.send(JSON.stringify({ type: "unreadMessages", data: { count: totalUnread } }));
        }

        // 🔹 Last message list
        else if (msg.type === "messageList") {
          if (!userId) return;

          const rooms = await Room.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
          }).populate("senderId receiverId");

          const result: any[] = [];
          for (const room of rooms) {
            const lastMessage = await Chat.findOne({ roomId: room._id })
              .sort({ createdAt: -1 })
              .limit(1);
            const otherUser = room.senderId.toString() === userId ? room.receiverId : room.senderId;
            result.push({ user: otherUser, lastMessage });
          }

          ws.send(JSON.stringify({ type: "messageList", data: result }));
        }

        // 🔹 Typing status
        else if (msg.type === "typing") {
          if (!userId) return;
          const { receiverId, isTyping } = msg.data;
          const receiverSocket = clients.get(receiverId);
          if (receiverSocket?.readyState === WebSocket.OPEN) {
            receiverSocket.send(JSON.stringify({ type: "typing", data: { senderId: userId, isTyping } }));
          }
        }

        // 🔹 Server health
        else if (msg.type === "server-health") {
          const serverData = await ServerHealthService.getServerData();
          const apiLatency = await ServerHealthService.getApiLatency();
          const errorRate = await ServerHealthService.getErrorRateLast60Minutes();

          ws.send(JSON.stringify({
            type: "server-health",
            data: { ...serverData, apiLatency, apiErrorRate: errorRate },
          }));
        }

      } catch (err) {
        console.error("WebSocket error:", err);
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
        broadcastOnlineStatus(userId, false);
        console.log("❌ User disconnected:", userId);
      }
    });
  });
}

// Helper: broadcast online/offline status
function broadcastOnlineStatus(userId: string, online: boolean) {
  for (const [_, ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "onlineStatus", data: { userId, online } }));
    }
  }
} 


