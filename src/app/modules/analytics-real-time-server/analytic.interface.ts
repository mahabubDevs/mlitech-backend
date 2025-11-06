export interface IServerHealth {
  uptimePercentage: string;
  load: string;
  memoryUsed: string;
  uptimeSeconds: number;
  lastIncident: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Query interface for logs API
export interface IServerHealthQuery {
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  minLoad?: number;
  maxLoad?: number;
  page?: number;
  limit?: number;
}
