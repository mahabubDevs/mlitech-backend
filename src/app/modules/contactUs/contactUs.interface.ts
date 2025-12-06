export interface IContactUs {
  name: string;
  email: string;
  phone: string;
  address: string;
  message?: string; // optional
  createdAt?: Date;
  updatedAt?: Date;
}
