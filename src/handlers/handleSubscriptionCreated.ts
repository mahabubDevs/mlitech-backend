import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import ApiError from '../errors/ApiErrors';
import stripe from '../config/stripe';
import { Subscription } from '../app/modules/subscription/subscription.model';
import { User } from '../app/modules/user/user.model';
// import { Package } from '../app/modules/package/package.model';
import { NotificationService } from '../app/modules/notification/notification.service';
import { Package } from '../app/modules/package/package.model';


export const handleSubscriptionCreated = async (data: Stripe.Subscription) => {
  console.log('Handling subscription created event for ID:', data.id);

  try {
    // Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(data.id);

    // Retrieve customer
    const customer = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;

    if (!customer?.email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No email found for the customer!');
    }

    // Find user by email
    const existingUser = await User.findOne({ email: customer.email });
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, `User with Email: ${customer.email} not found!`);
    }

    // Extract price ID from Stripe subscription
    const priceId = subscription.items.data[0]?.price?.id;

    if (!priceId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No price ID found in subscription items!');
    }

    // Find pricing plan by normal priceId or points-redeemed priceId
    const pricingPlan = await Package.findOne({
      $or: [
        { priceId: priceId },
        { priceIdWithPoints: { $in: [priceId] } }
      ]
    });

    if (!pricingPlan) {
      throw new ApiError(StatusCodes.NOT_FOUND, `Pricing plan with Price ID: ${priceId} not found!`);
    }

    // Get points used from metadata
    const pointsUsed = subscription.metadata?.pointsUsed ? parseInt(subscription.metadata.pointsUsed, 10) : 0;

    // Deduct points and log transaction
    if (pointsUsed > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        existingUser._id,
        { $inc: { points: -pointsUsed } },
        { new: true }
      );

    //   await TransactionHistory.create({
    //     userId: existingUser._id,
    //     type: 'REDEEM',
    //     points: pointsUsed,
    //     source: 'SUBSCRIPTION_REDEMPTION',
    //     balanceAfter: updatedUser!.points
    //   });

      console.log(`💎 Deducted ${pointsUsed} points from user ${existingUser._id}`);
    }

    // Retrieve invoice for trxId and amountPaid
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
    const trxId = invoice?.payment_intent as string;
    const amountPaid = invoice?.total ? invoice.total / 100 : 0;

    // Subscription period
    const currentPeriodStart = subscription.current_period_start;
    const currentPeriodEnd = subscription.current_period_end;
    const subscriptionId = subscription.id;
    const price = subscription.items.data[0].price.unit_amount! / 100;
    const remaining = subscription.items.data[0].quantity || 1;

    // Check if user already has subscription for this package
    const existingSubscription = await Subscription.findOne({
      user: existingUser._id,
      package: pricingPlan._id,
      subscriptionId: subscriptionId
    });

    if (existingSubscription) {
      console.log(`ℹ️ Subscription already exists for user ${existingUser._id} and package ${pricingPlan._id}`);
      return;
    }

    // Create new subscription
    const newSubscription = new Subscription({
      user: existingUser._id,
      customerId: customer.id,
      package: pricingPlan._id,
      status: 'active',
      trxId,
      amountPaid,
      price,
      subscriptionId,
      currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
      remaining,
      source: 'online'
    });

    await newSubscription.save();
    console.log(`✅ Subscription saved for user ${existingUser._id} and package ${pricingPlan._id}`);

  } catch (error) {
    console.error('Subscription Created Error:', error);
    throw error;
  }
};