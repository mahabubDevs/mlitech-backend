import { Model, Types } from "mongoose";

export type ISalesRep = {
  customerId: Types.ObjectId;
  acknowledged: boolean;
  token?: string;
  paymentStatus: "paid" | "unpaid" | "expired";
  createdAt: Date;
  updatedAt: Date;
};

export type SalesRepModel = Model<ISalesRep, Record<string, unknown>>;
