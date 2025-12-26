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

const createSubscriptionSession = async (userId: string, packageId: string) => {
    const pkg = await Package.findById(packageId);
    if (!pkg) throw new Error("Package not found");
    console.log("🚀 Creating subscription session for user:", userId, "with package:", packageId);
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: (await User.findById(userId))?.email,
        line_items: [
            {
                price: pkg.priceId,
                quantity: 1,
            },
        ],
        success_url: `https://miltech-business-dashboard-api.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://miltech-business-dashboard-api.vercel.app/failed`,
        client_reference_id: userId,
        metadata: {
            packageId: pkg._id.toString(),
        },
    });

    return { sessionId: session.id, url: session.url };
};

// Called from webhook to save subscription after payment success


const activateSubscriptionInDB = async (
    userId: string,
    packageId: string,
    stripeSubscription: any
): Promise<ISubscription> => {

    console.log("🚀 Activating subscription in DB", { userId, packageId, stripeSubscriptionId: stripeSubscription.id });

    // Prevent duplicate subscription
    const existingSub = await Subscription.findOne({ subscriptionId: stripeSubscription.id });
    if (existingSub) {
        console.log("⚠️ Subscription already exists in DB", existingSub._id);
        // Update user profile correctly
        await User.findByIdAndUpdate(userId, { subscription: "active" }, { new: true });

        const result = await Referral.findOne({
            referredUser: userId
        })
        if (result && !result.completed) {
            console.log("🚀 Processing referral for user: existing", userId);
            await PointTransaction.create({
                user: userId,
                type: "EARN",
                source: "REFERRAL",
                referral: result._id,
                points: 10,
                note: "Referral points",
            })
            await PointTransaction.create({
                user: result.referrer,
                type: "EARN",
                source: "REFERRAL",
                referral: result._id,
                points: 10,
                note: "Referral points",
            })

            await User.findByIdAndUpdate(
                result.referrer,
                { $inc: { points: 10 } },
                { new: true }
            );

            await User.findByIdAndUpdate(
                userId,
                { $inc: { points: 10 } },
                { new: true }
            );

            await sendNotification({ userIds: [result.referrer.toString()], title: "Referral points", body: "You have earned 10 points for referring a new user", type: NotificationType.REFERRAL });
            await sendNotification({ userIds: [userId.toString()], title: "Referral points", body: "You have earned 10 points for using referral code", type: NotificationType.REFERRAL });
            result.completed = true;
            await result.save();
        }
        return existingSub;
    }

    const subscriptionData: Partial<ISubscription> = {
        user: new Types.ObjectId(userId),
        package: new Types.ObjectId(packageId),
        price: stripeSubscription.plan?.amount / 100 || 0,
        customerId: stripeSubscription.customer,
        subscriptionId: stripeSubscription.id,
        remaining: 0,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        trxId: stripeSubscription.latest_invoice || "N/A",
        status: stripeSubscription.status === "active" ? "active" : "expired",
    };

    console.log("📌 Subscription data prepared:", subscriptionData);

    const subscription = await Subscription.create(subscriptionData);

    console.log("✅ Subscription saved:", subscription);

    // Update user profile
    await User.findByIdAndUpdate(userId, { subscription: "active" }, { new: true });
    const result = await Referral.findOne({
        referredUser: userId
    })
    if (result && !result.completed) {
        console.log("🚀 Processing referral for user: new", userId);
        await PointTransaction.create({
            user: userId,
            type: "EARN",
            source: "REFERRAL",
            referral: result._id,
            points: 10,
            note: "Referral points",
        })
        await PointTransaction.create({
            user: result.referrer,
            type: "EARN",
            source: "REFERRAL",
            referral: result._id,
            points: 10,
            note: "Referral points",
        })

        await User.findByIdAndUpdate(
            result.referrer,
            { $inc: { points: 10 } },
            { new: true }
        );

        await User.findByIdAndUpdate(
            userId,
            { $inc: { points: 10 } },
            { new: true }
        );

        await sendNotification({ userIds: [result.referrer.toString()], title: "Referral points", body: "You have earned 10 points for referring a new user", type: NotificationType.REFERRAL });
        await sendNotification({ userIds: [userId.toString()], title: "Referral points", body: "You have earned 10 points for using referral code", type: NotificationType.REFERRAL });
        result.completed = true;
        await result.save();
    }
    console.log("✅ User subscription updated in profile");


    await sendNotification({
        userIds: [userId.toString()],
        title: "Welcome to the app",
        body: "You have successfully subscribed to our app. We are excited to have you on board!",
        type: NotificationType.WELCOME
    })
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

const companySubscriptionDetailsFromDB = async (id: string): Promise<{ subscription: ISubscription | {} }> => {

    const subscription = await Subscription.findOne({ user: id }).populate("package", "title credit").lean();
    if (!subscription) {
        return { subscription: {} }; // Return empty object if no subscription found
    }

    const subscriptionFromStripe = await stripe.subscriptions.retrieve(subscription.subscriptionId);

    // Check subscription status and update database accordingly
    if (subscriptionFromStripe?.status !== "active") {
        await Promise.all([
            User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }),
            Subscription.findOneAndUpdate({ user: id }, { status: "expired" }, { new: true }),
        ]);
    }

    return { subscription };
};



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