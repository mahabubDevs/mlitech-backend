// src/app/modules/chat/chat.controller.ts
import { Request, Response } from "express";
import { ChatService } from "./chat.service";

import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { IData } from "../../../types/auth";
import { IChat } from "./chat.interface";
import catchAsync from "../../../shared/catchAsync";

// Fetch chats
const fetchChatsController = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;
  const otherUserId = req.params.userId;

  const chats: IChat[] = await ChatService.fetchChats(userId, otherUserId);

  const response: IData<IChat[]> = {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Chats fetched successfully",
    data: chats,
  };

  sendResponse(res, response);
});

// Recent chats
const recentChatsController = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;

  const chats = await ChatService.recentChats(userId);

  const response: IData<typeof chats> = {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Recent chats fetched successfully",
    data: chats,
  };

  sendResponse(res, response);
});

// Unread messages
const unreadCountController = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;
  const otherUserId = req.params.userId;

  const count: number = await ChatService.unreadCount(userId, otherUserId);

  const response: IData<{ count: number }> = {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Unread messages count fetched successfully",
    data: { count },
  };

  sendResponse(res, response);
});

export const ChatController = {
  fetchChats: fetchChatsController,
  recentChats: recentChatsController,
  unreadCount: unreadCountController,
};
