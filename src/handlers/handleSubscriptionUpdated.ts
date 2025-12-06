import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";
import ApiError from "../errors/ApiErrors";
import stripe from "../config/stripe";
import { Subscription } from "../app/modules/subscription/subscription.model";
import { User } from "../app/modules/user/user.model";
// import { Package } from "../app/modules/shopAuraSubscription/aurashop.module";

export const handleSubscriptionUpdated = async (data: Stripe.Subscription) => {
  try {
    const subscription = data;

    // Retrieve customer details
    const customer = (await stripe.customers.retrieve(
      subscription.customer as string
    )) as Stripe.Customer;

    if (!customer?.email) {
      console.warn("⚠️ No email found for the customer!");
      return;
    }

    // Find user by email
    const existingUser = await User.findOne({ email: customer.email });
    if (!existingUser) {
      console.warn(`⚠️ User not found for email: ${customer.email}`);
      return;
    }

    // Extract priceId from subscription
    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) {
      console.warn("⚠️ No priceId found in subscription items.");
      return;
    }

    // Find matching package
    const pricingPlan = await Package.findOne({ priceId });
    if (!pricingPlan) {
      console.warn(`⚠️ No pricing plan found for priceId: ${priceId}`);
      return;
    }

    // Get invoice if exists
    let trxId = "";
    let amountPaid = 0;
    if (subscription.latest_invoice) {
      try {
        const invoice = await stripe.invoices.retrieve(
          subscription.latest_invoice as string
        );
        trxId = invoice?.payment_intent as string;
        amountPaid = invoice?.total ? invoice.total / 100 : 0;
      } catch (err) {
        console.warn("⚠️ Invoice not found, continuing...");
      }
    }

    // Dates
    const currentPeriodStart = subscription.current_period_start
  ? new Date(subscription.current_period_start * 1000).toISOString()
  : null;

const currentPeriodEnd = subscription.current_period_end
  ? new Date(subscription.current_period_end * 1000).toISOString()
  : null;


    const subscriptionId = subscription.id;
    const price = subscription.items.data[0].price.unit_amount! / 100;
    const remaining = subscription.items.data[0].quantity || 1;

    // ✅ Find existing active subscription with package populated
    const currentActiveSubscription = await Subscription.findOne({
      user: existingUser._id,
      status: "active",
    }).populate("package");

    if (currentActiveSubscription) {
      const oldPackageId = currentActiveSubscription.package?._id?.toString();
      
      // যদি package change হয়ে থাকে বা oldPackageId না থাকে
      if (!oldPackageId || oldPackageId !== pricingPlan._id.toString()) {
        await Subscription.findByIdAndUpdate(currentActiveSubscription._id, {
          status: "expired", // enum অনুযায়ী
        });

        // নতুন subscription create
        await Subscription.create({
          user: existingUser._id,
          customerId: customer.id,
          package: pricingPlan._id,
          status: "active",
          trxId,
          amountPaid,
          price,
          subscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
          remaining,
        });

        await User.findByIdAndUpdate(existingUser._id, { role: "PAIDUSER" });
        console.log(`🔄 Subscription upgraded for user ${existingUser.email}`);
      } else {
        console.log(`ℹ️ Subscription already active for the same package.`);
      }
    } else {
      // যদি active subscription না থাকে
      await Subscription.create({
        user: existingUser._id,
        customerId: customer.id,
        package: pricingPlan._id,
        status: "active",
        trxId,
        amountPaid,
        price,
        subscriptionId,
        currentPeriodStart,
        currentPeriodEnd,
        remaining,
      });

      await User.findByIdAndUpdate(existingUser._id, { role: "PAIDUSER" });
      console.log(`✅ Subscription created for user ${existingUser.email}`);
    }
  } catch (error) {
    console.error("❌ Subscription Updated Error:", error);
    // throw না করে শুধু log করা, যাতে webhook সবসময় 200 return করে
  }
};
