import { Types } from "mongoose";

// Event Status
export type EventStatus = "Active" | "Expired" | "Scheduled";

// Event Type
export type EventType = "Unlimited Ad Time" | "Unlimited Games" | "Unlimited Select City" | "Off APshop";

// Event Interface for DB
export interface IEventDB {
  _id: string;
  eventName: string;
  eventType: EventType;
  state: string; // selected state
  startDate: Date;
  endDate: Date;
  image?: string;
  photo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: EventStatus;
  // Conditional fields
  selectedGame?: string; // If eventType = "Unlimited Games"
  offAPPercentage?: number; // If eventType = "Off APshop"
  createdBy: string;
}

// Create DTO
export interface ICreateEvent {
  eventName: string;
  eventType: EventType;
  state: string;
  startDate: Date | string;
  endDate: Date | string;
  image?: string;        // <-- add this
  status?: EventStatus;  
      // <-- add this if your code uses 'photo'
  selectedGame?: string;
  offAPPercentage?: number;
  createdBy: string;
}

// Update DTO (partial)
export interface IUpdateEvent extends Partial<ICreateEvent> {}

// Event list response
export interface IEventList {
  data: IEventDB[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
