import WebSocket from "ws";
import jwt from "jsonwebtoken";
import { Room } from "../app/modules/chat/chat.roommodel";
import { Chat } from "../app/modules/chat/chat.model";

interface WSMessage {
  type: string;
  data: any;
}

interface JwtUserPayload {
  id: string;
}

// Map of connected clients (import from wsServer.ts or share)
export const clients = new Map<string, WebSocket>();

export async function chatHandler(ws: WebSocket, msg: WSMessage) {
  let userId: string | null = (msg.data.userId as string) || null;

  // 🔹 Auth
  if (msg.type === "chat-auth") {
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

      ws.send(JSON.stringify({ type: "connected", data: "Authenticated" }));
      console.log("🔗 User connected (chat):", userId);
    } catch {
      ws.send(JSON.stringify({ type: "error", data: "Invalid token" }));
      ws.close();
    }
    return;
  }

  // 🔹 Send chat message
  if (msg.type === "chat-message") {
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
      receiverSocket.send(JSON.stringify({ type: "chat-message", data: chat }));
    }

    ws.send(JSON.stringify({ type: "chat-message", data: chat }));
  }

  // 🔹 Typing status
  if (msg.type === "chat-typing") {
    if (!userId) return;
    const { receiverId, isTyping } = msg.data;
    const receiverSocket = clients.get(receiverId);
    if (receiverSocket?.readyState === WebSocket.OPEN) {
      receiverSocket.send(JSON.stringify({ type: "chat-typing", data: { senderId: userId, isTyping } }));
    }
  }

  // 🔹 Unread messages
  if (msg.type === "chat-unread") {
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

    ws.send(JSON.stringify({ type: "chat-unread", data: { count: totalUnread } }));
  }

  // 🔹 Last message list
  if (msg.type === "chat-list") {
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

    ws.send(JSON.stringify({ type: "chat-list", data: result }));
  }
}
