// src/app/modules/chat/chat.interfaces.ts
import { Types } from "mongoose";



// src/types/auth.ts
export interface IData<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}



export interface IRoom {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
// src/app/modules/chat/chat.interfaces.ts
export interface IChat {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  images: string[];
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
