import { StatusCodes } from "http-status-codes";
import stripe from "../config/stripe";
import ApiError from "../errors/ApiErrors";
import { IPackage } from "../app/modules/package/package.interface";

export type StripeProductResult = {
    productId: string;
    priceId: string;
};

export const createSubscriptionProduct = async (
  payload: Partial<IPackage>
): Promise<StripeProductResult> => {
  if (!payload.title || !payload.price || !payload.duration) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Title, price, and duration are required");
  }

  // 1️⃣ Create Product in Stripe
  const product = await stripe.products.create({
    name: payload.title,
    description: payload.description ?? "",
  });

  // 2️⃣ Determine interval
  let interval: "month" | "year" = payload.duration!.includes("year") ? "year" : "month";

  // 3️⃣ Create Stripe Price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(payload.price! * 100), // cents
    currency: "usd",
    recurring: { interval },
  });

  return {
    productId: product.id,
    priceId: price.id,
  };
};
