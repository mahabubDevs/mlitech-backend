export interface IPackage {
  // id: string;
  title: string;
  description: string;
  price: number;
  duration:  "1 day" | "1 week" | "1 month" | "3 months" | "6 months" | "1 year";
  priceId?: string; // Stripe price ID
  productId?: string; // Stripe product ID
  isActive?: boolean;
}