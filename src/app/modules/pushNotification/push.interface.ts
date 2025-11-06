export interface ICreatePush {
  title: string;
  body: string;
  state: string; // state to send notification
  adminId?: string; // logged-in admin ID (optional, internally set)
}

export interface IPushResponse {
  success: boolean;
  sentCount: number;
  failedCount: number;
}
