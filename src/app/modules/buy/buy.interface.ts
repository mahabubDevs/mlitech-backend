import { Types } from "mongoose";

export interface IBuy {
  userId: Types.ObjectId;
  packageId: Types.ObjectId;
  minutesAdded: number;
  apSpent: number;
}
