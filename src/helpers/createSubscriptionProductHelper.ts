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
  const { title, price, duration, description } = payload;

  // 🔹 price = 0 allowed, only undefined/null check
  if (!title || price === undefined || price === null || !duration) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Title, price, and duration are required"
    );
  }

  // 🔹 Handle free plan (price = 0)
  if (price === 0) {
    return {
      productId: "FREE_PLAN",
      priceId: "FREE_PLAN",
    };
  }

  // 1️⃣ Create Product in Stripe
  const product = await stripe.products.create({
    name: title,
    description: description ?? "",
  });

  // 2️⃣ Determine interval
  let interval: "month" | "year" = duration.toLowerCase().includes("year")
    ? "year"
    : "month";

  // 3️⃣ Create Stripe Price
  const stripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(price * 100), // cents
    currency: "usd",
    recurring: { interval },
  });

  return {
    productId: product.id,
    priceId: stripePrice.id,
  };
};
