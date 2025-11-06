export interface ICreateGame {
  gameTitle: string;
  description: string;
  createdBy: string;
  image?: string;
  isActive?: boolean;
}

export interface IUpdateGame {
  gameTitle?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface IGameDB {
  _id: string;
  gameTitle: string;
  description: string;
  image?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}
