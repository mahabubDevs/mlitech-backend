// src/app/modules/chat/chat.service.ts
import { Chat } from "./chat.model";
import { Room } from "./chat.roommodel";
import { Types } from "mongoose";
import { IChat, IRoom } from "./chat.interface";

// Fetch all chats between two users
const fetchChats = async (userId: string, otherUserId: string): Promise<IChat[]> => {
  const room = await Room.findOne({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  }).lean() as IRoom | null; // ✅ lean + type assertion

  if (!room) return [];

  await Chat.updateMany(
    { roomId: room._id, receiverId: userId },
    { $set: { isRead: true } }
  );

  const chats: IChat[] = await Chat.find({ roomId: room._id })
  .sort("createdAt")
  .lean() as unknown as IChat[]; // ✅ lean + type assertion

  return chats;
};

// Recent chat list with last message per user
const recentChats = async (userId: string) => {
  const rooms: IRoom[] = await Room.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  }) as IRoom[];

  const result: { user: any; lastMessage: IChat | null }[] = [];

  for (const room of rooms) {
    const lastMessage: IChat | null = await Chat.findOne({ roomId: room._id })
      .sort({ createdAt: -1 })
      .lean() as IChat | null; // ✅ lean + type assertion

    const otherUser =
      room.senderId.toString() === userId ? room.receiverId : room.senderId;

    result.push({ user: otherUser, lastMessage });
  }

  return result;
};

// Unread messages count
const unreadCount = async (userId: string, otherUserId: string): Promise<number> => {
  const room: IRoom | null = await Room.findOne({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  }).lean() as IRoom | null; // ✅ lean + type assertion

  if (!room) return 0;

  const count = await Chat.countDocuments({
    roomId: room._id,
    isRead: false,
    receiverId: userId,
  });

  return count;
};

export const ChatService = { fetchChats, recentChats, unreadCount };
