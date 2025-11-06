import { StatusCodes } from "http-status-codes";
import { Subscription } from "../app/modules/subscription/subscription.model";
import stripe from "../config/stripe";
import ApiError from "../errors/ApiErrors";

export interface ISubscriptionPayload {
  title: string;
  description: string;
  price: number;
  duration: '1 day' | '1 week' | '1 month' | '3 months' | '6 months' | '1 year';
  userId: string; // client_reference_id হিসেবে Stripe এ পাঠানো হবে
}

export const SubscriptionService = {

  // Create Stripe product + session
  createSubscriptionProduct: async (payload: ISubscriptionPayload) => {

    let interval: 'day' | 'week' | 'month' | 'year' = 'month';
    let intervalCount = 1;

    switch (payload.duration) {
      case '1 day': interval = 'day'; intervalCount = 1; break;
      case '1 week': interval = 'week'; intervalCount = 1; break;
      case '1 month': interval = 'month'; intervalCount = 1; break;
      case '3 months': interval = 'month'; intervalCount = 3; break;
      case '6 months': interval = 'month'; intervalCount = 6; break;
      case '1 year': interval = 'year'; intervalCount = 1; break;
      default: interval = 'month'; intervalCount = 1;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: payload.title,
              description: payload.description,
            },
            unit_amount: Math.round(payload.price * 100),
            recurring: { interval, interval_count: intervalCount },
          },
          quantity: 1,
        },
      ],
      success_url: `https://yourfrontend.com/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://yourfrontend.com/payment-cancel`,
      metadata: { userId: payload.userId, duration: payload.duration }, // ✅ metadata updated
      client_reference_id: payload.userId,
    });

    if (!session.url) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create Stripe session");
    }

    return { sessionId: session.id, sessionUrl: session.url };
  },

  // Activate subscription in DB after webhook confirms payment
  activateSubscription: async (userId: string, productId: string, duration: string) => {
    const startDate = new Date();
    const endDate = new Date(startDate);

    switch (duration) {
      case '1 day': endDate.setDate(endDate.getDate() + 1); break;
      case '1 week': endDate.setDate(endDate.getDate() + 7); break;
      case '1 month': endDate.setMonth(endDate.getMonth() + 1); break;
      case '3 months': endDate.setMonth(endDate.getMonth() + 3); break;
      case '6 months': endDate.setMonth(endDate.getMonth() + 6); break;
      case '1 year': endDate.setFullYear(endDate.getFullYear() + 1); break;
      default: endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await Subscription.create({
      user: userId,
      productId,
      startDate,
      endDate,
      active: true,
      duration,
    });

    console.log(`✅ Subscription activated for user ${userId}`);
    return subscription;
  },
};
