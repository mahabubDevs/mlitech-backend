import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import ApiError from '../errors/ApiErrors';
import stripe from '../config/stripe';
import { Subscription } from '../app/modules/subscription/subscription.model';
import { User } from '../app/modules/user/user.model';
// import { Package } from '../app/modules/package/package.model';
import { NotificationService } from '../app/modules/notification/notification.service';
import { Package } from '../app/modules/package/package.model';


// export const handleSubscriptionCreated = async (data: Stripe.Subscription) => {

//   console.log('Handling subscription created event for ID:', data.id);

//   try {
//     // Retrieve subscription from Stripe
//     const subscription = await stripe.subscriptions.retrieve(data.id);

//     // Retrieve customer
//     const customer = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;

//     if (!customer?.email) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'No email found for the customer!');
//     }

//     // Find user by email
//     const existingUser = await User.findOne({ email: customer.email });
//     if (!existingUser) {
//       throw new ApiError(StatusCodes.NOT_FOUND, `User with Email: ${customer.email} not found!`);
//     }

//     // Extract price ID from Stripe subscription
//     const priceId = subscription.items.data[0]?.price?.id;

//     if (!priceId) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'No price ID found in subscription items!');
//     }

//     // Find pricing plan by normal priceId or points-redeemed priceId
//     // 1️⃣ Fetch all packages
//     const allPackages = await Package.find({});

//     // 2️⃣ Find package where either normal priceId or points-redeemed priceId matches
//     const pricingPlan = allPackages.find(pkg =>
//     pkg.priceId === priceId ||
//     Object.values(pkg.priceIdWithPoints || {}).includes(priceId)
//     );

//     if (!pricingPlan) {
//       throw new ApiError(StatusCodes.NOT_FOUND, `Pricing plan with Price ID: ${priceId} not found!`);
//     }

//     // Get points used from metadata
//     const pointsUsed = subscription.metadata?.pointsUsed ? parseInt(subscription.metadata.pointsUsed, 10) : 0;

//     // Deduct points and log transaction
//     if (pointsUsed > 0) {
//       const updatedUser = await User.findByIdAndUpdate(
//         existingUser._id,
//         { $inc: { points: -pointsUsed } },
//         { new: true }
//       );

//     //   await TransactionHistory.create({
//     //     userId: existingUser._id,
//     //     type: 'REDEEM',
//     //     points: pointsUsed,
//     //     source: 'SUBSCRIPTION_REDEMPTION',
//     //     balanceAfter: updatedUser!.points
//     //   });

//       console.log(`💎 Deducted ${pointsUsed} points from user ${existingUser._id}`);
//     }

//     // Retrieve invoice for trxId and amountPaid
//     const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
//     const trxId = invoice?.payment_intent as string;
//     const amountPaid = invoice?.total ? invoice.total / 100 : 0;

//     // Subscription period
//     const currentPeriodStart = subscription.current_period_start;
//     const currentPeriodEnd = subscription.current_period_end;
//     const subscriptionId = subscription.id;
//     const price = subscription.items.data[0].price.unit_amount! / 100;
//     const remaining = subscription.items.data[0].quantity || 1;

//     // Check if user already has subscription for this package
//     const existingSubscription = await Subscription.findOne({
//       user: existingUser._id,
//       package: pricingPlan._id,
//       subscriptionId: subscriptionId
//     });

//     if (existingSubscription) {
//       console.log(`ℹ️ Subscription already exists for user ${existingUser._id} and package ${pricingPlan._id}`);
//       return;
//     }

//     // Create new subscription
//     const newSubscription = new Subscription({
//       user: existingUser._id,
//       customerId: customer.id,
//       package: pricingPlan._id,
//       status: 'active',
//       trxId,
//       amountPaid,
//       price,
//       subscriptionId,
//       currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
//       currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
//       remaining,
//       source: 'online'
//     });

//     await newSubscription.save();
//     console.log(`✅ Subscription saved for user ${existingUser._id} and package ${pricingPlan._id}`);

//   } catch (error) {
//     console.error('Subscription Created Error:', error);
//     throw error;
//   }
// };




export const handleSubscriptionCreated = async (data: Stripe.Subscription) => {
  console.log('=================>> Received Stripe webhook');
  console.log('Handling subscription created event for ID:', data.id);

  try {
    // 1️⃣ Retrieve subscription from Stripe
    console.log('🔄 Retrieving subscription from Stripe...');
    const subscription = await stripe.subscriptions.retrieve(data.id);
    console.log('✅ Subscription retrieved:', subscription.id);

    // 2️⃣ Retrieve customer
    console.log('🔄 Retrieving customer from Stripe...');
    const customer = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;
    if (!customer?.email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No email found for the customer!');
    }
    console.log(`✅ Customer retrieved: ${customer.email}`);

    // 3️⃣ Find user by email
    console.log('🔄 Finding user in DB...');
    const existingUser = await User.findOne({ email: customer.email });
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, `User with Email: ${customer.email} not found!`);
    }
    console.log(`✅ User found: ${existingUser._id}`);

    // 4️⃣ Extract price ID from subscription item
    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No price ID found in subscription items!');
    }
    console.log(`💳 Stripe Price ID detected: ${priceId}`);

    // 5️⃣ Find pricing plan (normal + points)
    console.log('🔄 Searching for pricing plan in DB...');
    const allPackages = await Package.find({});
    const pricingPlan = allPackages.find(pkg =>
      pkg.priceId === priceId || Object.values(pkg.priceIdWithPoints || {}).includes(priceId)
    );


    if (!pricingPlan) {
    console.warn(`⚠️ No pricing plan found for priceId: ${priceId}`);
    throw new ApiError(StatusCodes.NOT_FOUND, `Pricing plan with Price ID: ${priceId} not found!`);
    }

    // 1️⃣ Determine if subscription is purchased using points
    const isPointsPrice = Object.values(pricingPlan.priceIdWithPoints || {}).includes(priceId);

    if (isPointsPrice) {
    // 🔹 Points-price → deduct points from user's profile
    const pointsUsed = subscription.metadata?.pointsUsed
        ? parseInt(subscription.metadata.pointsUsed, 10)
        : 0;

    if (pointsUsed > 0) {
        console.log(`🔄 Deducting ${pointsUsed} points from user...`);
        const updatedUser = await User.findByIdAndUpdate(
        existingUser._id,
        { $inc: { points: -pointsUsed } },
        { new: true }
        );
        console.log(`💎 Deducted ${pointsUsed} points. User new points: ${updatedUser?.points}`);
    } else {
        console.log('⚠️ Points price used but pointsUsed metadata missing!');
    }
    } else {
    // 🔹 Normal price → আগের logic 그대로 থাকবে
    console.log('ℹ️ Normal price used → no points deduction, regular subscription logic applies.');
    }

    if (!pricingPlan) {
      console.warn(`⚠️ No pricing plan found for priceId: ${priceId}`);
      throw new ApiError(StatusCodes.NOT_FOUND, `Pricing plan with Price ID: ${priceId} not found!`);
    }
    console.log(`✅ Pricing plan found: ${pricingPlan._id}`);

    // 6️⃣ Get points used from metadata
    const pointsUsed = subscription.metadata?.pointsUsed ? parseInt(subscription.metadata.pointsUsed, 10) : 0;
    if (pointsUsed > 0) {
      console.log(`🔄 Deducting ${pointsUsed} points from user...`);
      const updatedUser = await User.findByIdAndUpdate(
        existingUser._id,
        { $inc: { points: -pointsUsed } },
        { new: true }
      );
      console.log(`💎 Deducted ${pointsUsed} points. User new points: ${updatedUser?.points}`);
    } else {
      console.log('ℹ️ No points used for this subscription');
    }

    // 7️⃣ Retrieve invoice for trxId and amountPaid
    console.log('🔄 Retrieving invoice from Stripe...');
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
    const trxId = invoice?.payment_intent as string;
    const amountPaid = invoice?.total ? invoice.total / 100 : 0;
    console.log(`💰 Invoice retrieved. trxId: ${trxId}, amountPaid: ${amountPaid}`);

    // 8️⃣ Subscription period
    const currentPeriodStart = subscription.current_period_start;
    const currentPeriodEnd = subscription.current_period_end;
    const subscriptionId = subscription.id;
    const price = subscription.items.data[0].price.unit_amount! / 100;
    const remaining = subscription.items.data[0].quantity || 1;

    // 9️⃣ Check existing subscription
    const existingSubscription = await Subscription.findOne({
      user: existingUser._id,
      package: pricingPlan._id,
      subscriptionId: subscriptionId
    });

    if (existingSubscription) {
      console.log(`ℹ️ Subscription already exists for user ${existingUser._id} and package ${pricingPlan._id}`);
      return;
    }

    // 🔟 Create new subscription
    console.log('🔄 Creating new subscription in DB...');
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

    console.log('=================>> Stripe webhook handled successfully');

  } catch (error) {
    console.error('❌ Subscription Created Error:', error);
    throw error;
  }
};
