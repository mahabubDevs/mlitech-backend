import { JwtPayload } from "jsonwebtoken";
import { Package } from "../package/package.model";
import { ISubscription } from "./subscription.interface";
import { Subscription } from "./subscription.model";
import stripe from "../../../config/stripe";
import { User } from "../user/user.model";
import Stripe from "stripe";
import { Types } from "mongoose";
import Referral from "../referral/referral.model";
import PointTransaction from "../pointTransaction/pointTransaction.model";
import { sendNotification } from "../../../helpers/notificationsHelper";
import { NotificationType } from "../notification/notification.model";
import { calculateEndDate } from "../../../helpers/dateHelper";
import { SUBSCRIPTION_STATUS } from "../../../enums/user";
import { TransactionHistory } from "../transectionHistory/transection.model";

// =========================
// createSubscriptionSession
// =========================

const calculateISODateString = (date: Date) => {
  return date.toISOString(); // "2026-04-06T05:31:35.697Z" ফরম্যাটে
};
const createSubscriptionSession = async (userId: string, packageId: string) => {
  console.log("🚀 createSubscriptionSession called");
  console.log("UserId:", userId, "PackageId:", packageId);

  const pkg = await Package.findById(packageId);
  if (!pkg) throw new Error("Package not found");
  console.log(`✅ Package found: ${pkg.title}, isFreeTrial: ${pkg.isFreeTrial}`);

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  console.log(`👤 User found: ${user.firstName}, Email: ${user.email}, Points: ${user.points}`);

  // Free trial
  if (pkg.isFreeTrial) {
    const hasUsedFreePlan = await Subscription.exists({ user: userId, package: packageId });
    if (hasUsedFreePlan) throw new Error("You have already used the free plan");

    const subscription = await Subscription.create({
      user: userId,
      package: packageId,
      price: 0,
      subscriptionId: "FREE_PLAN_" + Date.now(),
      currentPeriodStart: calculateISODateString(new Date()),
      currentPeriodEnd: calculateISODateString(calculateEndDate(pkg.duration)),
      status: "active",
      source: "manual",
      remaining: 1,
      customerId: null,
    });

     console.log("💾 Saving free plan subscription to DB:", subscription);

    await User.findByIdAndUpdate(userId, { subscription: SUBSCRIPTION_STATUS.ACTIVE,paymentStatus: "paid", });
    console.log("✅ Free plan subscription created:", subscription._id);
    return { sessionId: null, url: null, subscription };
  }

  // Paid plan
  console.log("💰 Paid plan detected");
  let userPoints = user.points || 0;
  let finalPrice = pkg.price;
  const maxDiscount = pkg.price * 0.8;
  const usablePoints = Math.min(userPoints, maxDiscount);

  if (usablePoints > 0) {
    finalPrice -= usablePoints;
    console.log(`💎 Final price after points: ${finalPrice}`);
  }

  // Stripe Price logic
  pkg.priceIdWithPoints = pkg.priceIdWithPoints || {};
  let stripePriceId: string;

  if (usablePoints > 0) {
    if (pkg.priceIdWithPoints[usablePoints]) {
      stripePriceId = pkg.priceIdWithPoints[usablePoints];
    } else {
      const stripePrice = await stripe.prices.create({
        product: pkg.productId,
        unit_amount: Math.round(finalPrice * 100),
        currency: "usd",
        recurring: {
          interval: pkg.paymentType?.toLowerCase() === "monthly" ? "month" : "year",
        },
      });
      stripePriceId = stripePrice.id;
      pkg.priceIdWithPoints[usablePoints] = stripePriceId;
      await Package.findByIdAndUpdate(pkg._id, { priceIdWithPoints: pkg.priceIdWithPoints });
    }
  } else {
    stripePriceId = pkg.priceId!;
  }

  // ✅ Checkout session
  const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `https://miltech-business-dashboard-api.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://miltech-business-dashboard-api.vercel.app/failed`,
    client_reference_id: userId.toString(),
    metadata: {
      packageId: pkg._id.toString(),
      pointsUsed: usablePoints.toString(),
    },
  });

  console.log("✅ Stripe checkout session created:", session.id, session.url);
  return { sessionId: session.id, url: session.url };
};







// Called from webhook to save subscription after payment success


const activateSubscriptionInDB = async (
  userId: string,
  packageId: string,
  stripeSubscription: any
): Promise<ISubscription> => {

  console.log("==================================================");
  console.log("🚀 Activating subscription in DB");
  console.log({
    userId,
    packageId,
    stripeSubscriptionId: stripeSubscription?.id
  });
  console.log("==================================================");

  // 🔍 Prevent duplicate subscription
  const existingSub = await Subscription.findOne({
    subscriptionId: stripeSubscription.id
  });

  console.log("🔎 Existing Subscription Found:", !!existingSub);

  if (existingSub) {
    console.log("⚠️ Subscription already exists in DB:", existingSub._id);

    await User.findByIdAndUpdate(userId, {
      subscription: "active",
      paymentStatus: "paid"
    });

    console.log("✅ User subscription status updated to active (duplicate case)");
    return existingSub;
  }

  // 📦 Prepare subscription data
  const subscriptionData: Partial<ISubscription> = {
    user: new Types.ObjectId(userId),
    package: new Types.ObjectId(packageId),
    price: stripeSubscription.plan?.amount / 100 || 0,
    customerId: stripeSubscription.customer,
    subscriptionId: stripeSubscription.id,
    remaining: 0,
    currentPeriodStart: new Date(
      stripeSubscription.current_period_start * 1000
    ).toISOString(),
    currentPeriodEnd: new Date(
      stripeSubscription.current_period_end * 1000
    ).toISOString(),
    trxId: stripeSubscription.latest_invoice || "N/A",
    status: stripeSubscription.status === "active" ? "active" : "expired",
  };

  console.log("📌 Subscription Data Prepared:");
  console.log(subscriptionData);

  // 💾 Save subscription
  const subscription = await Subscription.create(subscriptionData);
  console.log("✅ Subscription Saved Successfully:", subscription._id);

  // 👤 Update user profile
  await User.findByIdAndUpdate(userId, {
    subscription: "active",
    paymentStatus: "paid"
  });

  console.log("✅ User subscription field updated to active");

  // ======================================================
  // 🔥 Referral Bonus (20% to referrer ONLY)
  // ======================================================

  console.log("--------------------------------------------------");
  console.log("🔍 Starting Referral Bonus Check");

  const existingSubscriptionsCount = await Subscription.countDocuments({
    user: userId,
  });

  console.log("📊 Total Subscriptions For User:", existingSubscriptionsCount);

  const userDoc = await User.findById(userId);

  console.log("👤 User Found:", !!userDoc);
  console.log("👤 User Role:", userDoc?.role);
  console.log("👤 Referred By:", userDoc?.referredInfo?.referredBy);
  console.log("👑 Referred UserId (ObjectId):", userDoc?.referredInfo?.referredUserId);

  if (
    existingSubscriptionsCount === 1 &&
    userDoc?.referredInfo?.referredUserId && // ✅ Use ObjectId now
    userDoc.role === "USER"
  ) {

    console.log("✅ Referral Conditions Matched");

    const referrerId = userDoc.referredInfo.referredUserId; // ObjectId
    console.log("👑 Referrer ID:", referrerId);

    const alreadyGiven = await User.findOne({
      _id: referrerId,
      referralBonusGivenFor: userId
    });

    console.log("🔎 Referral Bonus Already Given?:", !!alreadyGiven);

    if (!alreadyGiven) {

      const subscriptionPrice = subscriptionData.price || 0;
      console.log("💰 Subscription Price:", subscriptionPrice);

      const referralPoints = Math.round(subscriptionPrice * 0.2);
      console.log("🎁 Calculated Referral Points (20%):", referralPoints);

     if (referralPoints > 0) {

      const updatedReferrer = await User.findByIdAndUpdate(
        referrerId,
        {
          $inc: { points: referralPoints },
          $push: { referralBonusGivenFor: userId }
        },
        { new: true }
      );

      console.log("💎 Referral Points Added Successfully");
      console.log("👑 Updated Referrer Points:", updatedReferrer?.points);

      // ======================================================
      // 🧾 CREATE POINT TRANSACTION (NEWLY ADDED)
      // ======================================================

      console.log("========== REFERRAL DEBUG START ==========");

      console.log("Referrer ID:", referrerId?.toString());
      console.log("Referred User ID:", userId?.toString());

      const referralRecord = await Referral.findOne({
        referrer: referrerId,
        referredUser: userId   // ✅ fixed field name
      });

      console.log("Referral Record Found?:", !!referralRecord);

      if (!referralRecord) {
        console.log("❌ Referral record NOT FOUND in DB");
      } else {
        console.log("✅ Referral Record ID:", referralRecord._id.toString());
      }

      await PointTransaction.create({
        user: referrerId,
        type: "EARN",
        source: "REFERRAL",
        referral: referralRecord?._id,
        points: referralPoints,
        note: `Earned ${referralPoints} points from referral subscription (${userId})`
      });

      console.log("🧾 Referral Point Transaction Created");
      console.log("Referral ID Saved:", referralRecord?._id || "NULL");
      console.log("========== REFERRAL DEBUG END ==========");

      // ======================================================

      await sendNotification({
        userIds: [referrerId.toString()],
        title: "Referral Bonus Earned ",
        body: `You earned ${referralPoints} points from your referral's subscription.`,
        type: NotificationType.REFERRAL
      });

      console.log("📩 Referral Notification Sent");
    }
 else {
        console.log("⚠️ Referral Points <= 0. Bonus Skipped.");
      }

    } else {
      console.log("⚠️ Referral Bonus Already Given Previously.");
    }

  } else {
    console.log("❌ Referral Conditions NOT Matched");
    console.log({
      isFirstSubscription: existingSubscriptionsCount === 1,
      hasReferrer: !!userDoc?.referredInfo?.referredUserId,
      isUserRole: userDoc?.role === "USER"
    });
  }

  console.log("🔚 Referral Bonus Check Finished");
  console.log("--------------------------------------------------");

  // ======================================================

  // 🎉 Welcome notification
  await sendNotification({
    userIds: [userId.toString()],
    title: "Welcome to the app",
    body: "You have successfully subscribed to our app. We are excited to have you on board!",
    type: NotificationType.WELCOME
  });

  console.log("📩 Welcome Notification Sent");

  console.log("==================================================");
  console.log("✅ Subscription Activation Process Completed");
  console.log("==================================================");

  return subscription;
};




const cancelSubscription = async (user: JwtPayload) => {

    // 1️⃣ DB থেকে active subscription খুঁজে বের করো
    const subscription = await Subscription.findOne({ user: user._id, status: "active" });
    if (!subscription) {
        throw new Error("Active subscription not found");
    }

    // 2️⃣ Stripe এ cancel_at_period_end set করো
    await stripe.subscriptions.update(subscription.subscriptionId, {
        cancel_at_period_end: true
    });

    // 3️⃣ DB তে status update করো (optional: 'cancelling')
    subscription.status = "cancel"; // তুমি চাইলে 'cancelling' রাখতে পারো
    await subscription.save();

    // 4️⃣ User এর isSubscribed update করতে পারো (optional)
    await User.findByIdAndUpdate(user.id, { isSubscribed: false });

    return {
        subscriptionId: subscription.subscriptionId,
        currentPeriodEnd: subscription.currentPeriodEnd
    };
};


const subscriptionDetailsFromDB = async (user: JwtPayload): Promise<{ subscription: ISubscription | {} }> => {

    const subscription = await Subscription.findOne({ user: user.id }).populate("package", "title credit").lean();
    if (!subscription) {
        return { subscription: {} }; // Return empty object if no subscription found
    }

    const subscriptionFromStripe = await stripe.subscriptions.retrieve(subscription.subscriptionId);

    // Check subscription status and update database accordingly
    if (subscriptionFromStripe?.status !== "active") {
        await Promise.all([
            User.findByIdAndUpdate(user.id, { isSubscribed: false }, { new: true }),
            Subscription.findOneAndUpdate({ user: user.id }, { status: "expired" }, { new: true }),
        ]);
    }

    return { subscription };
};

const companySubscriptionDetailsFromDB = async (
  userId: string
): Promise<{ subscriptions: ISubscription[] }> => {
  // 1️⃣ Fetch all subscriptions for the user, populate package details, and sort latest first
  const subscriptions = await Subscription.find({ user: userId })
    .populate("package", "title credit")
    .sort({ createdAt: -1 }) // latest first
    .lean();

  if (!subscriptions || subscriptions.length === 0) {
    return { subscriptions: [] };
  }

  // 2️⃣ Optionally check Stripe status for each subscription and mark expired
  await Promise.all(subscriptions.map(async (sub) => {
    let subscriptionFromStripe;
    try {
      subscriptionFromStripe = await stripe.subscriptions.retrieve(sub.subscriptionId);
    } catch (error) {
      console.warn("Stripe subscription retrieve failed:", error);
      subscriptionFromStripe = null;
    }

    if (!subscriptionFromStripe || subscriptionFromStripe.status !== "active") {
      await Promise.all([
        User.findByIdAndUpdate(userId, { isSubscribed: false }, { new: true }),
        Subscription.findByIdAndUpdate(sub._id, { status: "expired" }, { new: true }),
      ]);
    }
  }));

  return { subscriptions };
}



const subscriptionsFromDB = async (query: Record<string, unknown>): Promise<ISubscription[]> => {
    const anyConditions: any[] = [];

    const { search, limit, page, paymentType } = query;

    if (search) {
        const matchingPackageIds = await Package.find({
            $or: [
                { title: { $regex: search, $options: "i" } },
                { paymentType: { $regex: search, $options: "i" } },
            ]
        }).distinct("_id");

        if (matchingPackageIds.length) {
            anyConditions.push({
                package: { $in: matchingPackageIds }
            });
        }
    }



    if (paymentType) {
        anyConditions.push({
            package: { $in: await Package.find({ paymentType: paymentType }).distinct("_id") }
        })
    }

    const whereConditions = anyConditions.length > 0 ? { $and: anyConditions } : {};
    const pages = parseInt(page as string) || 1;
    const size = parseInt(limit as string) || 10;
    const skip = (pages - 1) * size;

    const result = await Subscription.find(whereConditions).populate([
        {
            path: "package",
            select: "title paymentType credit description"
        },
        {
            path: "user",
            select: "email name linkedIn contact company website "
        },
    ])
        .select("user package price trxId currentPeriodStart currentPeriodEnd status")
        .skip(skip)
        .limit(size);

    const count = await Subscription.countDocuments(whereConditions);

    const data: any = {
        data: result,
        meta: {
            page: pages,
            total: count
        }
    }

    return data;
}

export const SubscriptionService = {
    createSubscriptionSession,
    activateSubscriptionInDB,
    subscriptionDetailsFromDB,
    subscriptionsFromDB,
    companySubscriptionDetailsFromDB,
    cancelSubscription
}








// batter thinkg but any time need then apply this logic

