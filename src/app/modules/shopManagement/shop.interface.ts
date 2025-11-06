// shop.interface.ts
export interface ICreateShop {
  bundleType: "call" | "aura";
  status?: "active" | "block";
  callBundle?: {
    enterTime: number;
    neededAura: number;
  };
  auraBundle?: {
    auraNumber: number;
    amount: number;
  };
  createdBy: string;
}

export interface IUpdateShop {
  status?: "active" | "block";
  callBundle?: {
    enterTime?: number;
    neededAura?: number;
  };
  auraBundle?: {
    auraNumber?: number;
    amount?: number;
  };
}

export interface IShopDB {
  _id: string;
  bundleType: "call" | "aura";
  status: "active" | "block";
  callBundle?: {
    enterTime: number;
    neededAura: number;
  };
  auraBundle?: {
    auraNumber: number;
    amount: number;
  };
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
