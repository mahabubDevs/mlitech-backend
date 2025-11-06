// src/modules/subscription/subscription.service.ts

import stripe from "../../../config/stripe";
import ApiError from "../../../errors/ApiErrors";
import { Package } from "../shopAuraSubscription/aurashop.module";
// import { Package } from "../package/package.model";
import { Subscription } from "./subscription.model";
import { StatusCodes } from "http-status-codes";


export const SubscriptionService = {
  createCheckoutSession: async (userId: string, packageId: string, successUrl: string, cancelUrl: string) => {
    const selectedPackage = await Package.findById(packageId);
    if (!selectedPackage) throw new ApiError(StatusCodes.NOT_FOUND, "Package not found");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPackage.priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        packageId: selectedPackage._id.toString(), // ✅ Add packageId here
      },
    });

    return session.url;
  },

 // ✅ Step 2: Webhook থেকে subscription DB তে save করা
  activateSubscriptionInDB: async (
    userId: string,
    packageId: string,
    stripeSubscription: any,
    trxId?: string
  ) => {
    const currentPeriodStart = new Date(
      stripeSubscription.current_period_start * 1000
    );
    const currentPeriodEnd = new Date(
      stripeSubscription.current_period_end * 1000
    );

    const newSub = await Subscription.create({
      user: userId,
      package: packageId,
      customerId: stripeSubscription.customer,
      subscriptionId: stripeSubscription.id,
      trxId: trxId || "", // ✅ payment_intent / charge id save করো
      price: stripeSubscription.items?.data[0]?.plan?.amount
        ? stripeSubscription.items.data[0].plan.amount / 100
        : 0,
      status: stripeSubscription.status || "active",
      currentPeriodStart: currentPeriodStart.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      remaining: 1,
    });

    return newSub;
  },
};
