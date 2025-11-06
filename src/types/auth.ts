export type IVerifyEmail = {
    email: string;
    oneTimeCode: number;
};

export type ILoginData = {
    email: string;
    password: string;
};

export type IAuthResetPassword = {
    newPassword: string;
    confirmPassword: string;
};

export type IChangePassword = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export type IVerifyPhone = {
  phone: string;
  oneTimeCode: number | string;
}

export interface IData<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  pagination?: {          // 🔹 optional
    total: number;
    limit: number;
    page: number;
    totalPage: number;
  };
}