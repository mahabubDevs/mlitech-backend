export interface ITier {
  _id?: string;
  name: string;
  pointsThreshold: number;
  reward: string;
  accumulationRule: number;
  redemptionRule: number;
  minTotalSpend: number;
  isActive?: boolean;
  admin: string; // user/admin ID
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}
