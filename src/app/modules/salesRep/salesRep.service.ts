import { JwtPayload } from "jsonwebtoken";
import { SalesRep } from "./salesRep.model";
import { User } from "../user/user.model";
import QueryBuilder from "../../../util/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { SUBSCRIPTION_STATUS, USER_ROLES, USER_STATUS } from "../../../enums/user";
import { generateCashToken } from "../../../util/generateCashToken";
import { ISubscription } from "../subscription/subscription.interface";
import { Types } from "mongoose";
import { Subscription } from "../subscription/subscription.model";
import { Package } from "../package/package.model";
import { sendNotification } from "../../../helpers/notificationsHelper";
import { NotificationType } from "../notification/notification.model";
import Referral from "../referral/referral.model";
import PointTransaction from "../pointTransaction/pointTransaction.model";
import { sendPushNotification } from "../../../helpers/sendPushNotification";
import { IPackage } from "../package/package.interface";

const createSalesRepData = async (user: JwtPayload, packageId: string) => {

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 🔍 Check if SalesRep exists in last 7 days
  const existingSalesRep = await SalesRep.findOne({
    customerId: user._id,
    createdAt: { $gte: sevenDaysAgo },
  });

  if (existingSalesRep) {
    return null;
  }

  const price = await Package.findById(packageId).select("price");
  await SalesRep.create({
    customerId: user._id,
    packageId,
    price: price?.price,
  });

  const admins = await User.find({ role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] } }).select("_id");

  await sendNotification({
    userIds: admins.map((admin) => admin._id),
    title: "New customer added in sales rep",
    body: "A customer requested to make payment by sales rep.",
    type: NotificationType.SYSTEM,
  });

  await User.findByIdAndUpdate(user._id, { isUserWaiting: true }, {
    upsert: true
  });

};
const getSalesRepData = async (query: Record<string, unknown>) => {
  const baseQuery = SalesRep.find().populate(
    "customerId",
    "customUserId firstName lastName email phone  paymentStatus subscription"
  );

  const salesRepQuery = new QueryBuilder(baseQuery, query)
    .paginate()
    .filter()
    .sort()
    .search(["firstName", "lastName", "email"]);

  const [salesRep, pagination] = await Promise.all([
    salesRepQuery.modelQuery.lean(),
    salesRepQuery.getPaginationInfo(),
  ]);

  return {
    salesRep,
    pagination,
  };
};

const updateUserAcknowledgeStatus = async (dataId: string, salesRepId: string) => {

  const salesRep = await User.findById(salesRepId);
  if (!salesRep) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "No sales rep found for the given user"
    );
  }
  const result = await SalesRep.findByIdAndUpdate(
    dataId,
    {
      salesRepName: `${salesRep?.firstName} ${salesRep?.lastName ?? ""}`.trim(),
      salesRepReferralId: salesRep.referenceId,
      acknowledged: true,
      acknowledgeDate: new Date(),
    },
    { new: true, runValidators: true }
  );
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "No sales rep found for the given user"
    );
  }


  // await sendNotification({
  //   userIds: [result.customerId],
  //   title: "Sales rep acknowledged",
  //   body: "Your sales rep has acknowledged your request.",
  //   type: NotificationType.SYSTEM,
  // })
};
const generateToken = async (id: string) => {

  const salesRep = await SalesRep.findById(id);
  if (!salesRep) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Sales rep not found");
  }

  if (salesRep.token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Token already generated");
  }
  // const user = await User.findById(salesRep.customerId).select("status");

  // if (!user) {
  //   throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  // }

  // if (user.status !== USER_STATUS.ACTIVE) {
  //   throw new ApiError(StatusCodes.FORBIDDEN, "User is not active");
  // }

  const token = generateCashToken();

  const result = await SalesRep.findByIdAndUpdate(
    id,
    {
      token,
      tokenGenerateDate: new Date(),
      paymentStatus: "paid"
    },
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "No sales rep record found for this user"
    );
  }
  return { token };
};
const validateToken = async (userId: string, token: string) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const result = await SalesRep.findOne({ customerId: userId, token, createdAt: { $gte: sevenDaysAgo } });

  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request");
  }
  if (result.paymentStatus === "paid") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Already Validated");
  }
  if (result.token !== token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Token");
  }

  const existingPackage = await Package.findById(result.packageId);
  if (!existingPackage) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Package not found");
  }
  result.paymentStatus = "paid";
  result.price = existingPackage?.price;
  await result.save();


  // this is for test purpose
  const subscriptionData: Partial<ISubscription> = {
    user: new Types.ObjectId(userId),
    package: new Types.ObjectId(result.packageId),
    price: existingPackage?.price,
    customerId: userId,
    subscriptionId: new Date().toISOString(),
    remaining: 0,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString();
    })(),
    trxId: "N/A",
    status: "active",
    source: "salesRep",
  };
  await Subscription.create({ ...subscriptionData });
  await User.findByIdAndUpdate(
    userId,
    { subscription: SUBSCRIPTION_STATUS.ACTIVE },
    { new: true }
  );

  await sendNotification({
    userIds: [userId],
    title: "Welcome to the app",
    body: "You have successfully subscribed to our app. We are excited to have you on board!",
    type: NotificationType.WELCOME
  })

  const referralResult = await Referral.findOne({
    referredUser: userId
  })
  if (referralResult && !referralResult.completed) {
    console.log("🚀 Processing referral for user: new", userId);
    const referredUser = await User.findById(userId).select("firstName lastName");
    const referrerUser = await User.findById(referralResult.referrer).select("firstName lastName");

    const referredUserName = `${referredUser?.firstName || ""} ${referredUser?.lastName || ""}`.trim();
    const referrerUserName = `${referrerUser?.firstName || ""} ${referrerUser?.lastName || ""}`.trim();

    // Create point transactions
    await PointTransaction.create({
      user: userId,
      type: "EARN",
      source: "REFERRAL",
      referral: referralResult._id,
      points: 10,
      note: "Referral points",
    });
    await PointTransaction.create({
      user: referralResult.referrer,
      type: "EARN",
      source: "REFERRAL",
      referral: referralResult._id,
      points: 10,
      note: "Referral points",
    });

    // Update points
    await User.findByIdAndUpdate(referralResult.referrer, { $inc: { points: 10 } }, { new: true });
    await User.findByIdAndUpdate(userId, { $inc: { points: 10 } }, { new: true });

    // Send notifications with names
    await sendNotification({
      userIds: [referralResult.referrer.toString()],
      title: "Referral points",
      body: `You have earned 10 points for referring ${referredUserName}`,
      type: NotificationType.REFERRAL,
    });
    await sendNotification({
      userIds: [userId.toString()],
      title: "Referral points",
      body: `You have earned 10 points for being referred by ${referrerUserName}`,
      type: NotificationType.REFERRAL,
    });

    referralResult.completed = true;
    await referralResult.save();
  }


};



const getDurationInDays = (duration: IPackage['duration']): number => {
  switch (duration) {
    case '1 month':
      return 30;
    case '4 months':
      return 120;
    case '8 months':
      return 240;
    case '1 year':
      return 365;
    default:
      return 30; // fallback
  }
};

const activateAccount = async (id: string) => {
  // 1️⃣ SalesRep খুঁজে আনা
  const salesRep = await SalesRep.findById(id);
  if (!salesRep) throw new ApiError(StatusCodes.NOT_FOUND, "Sales rep not found");

  // 2️⃣ Package খুঁজে আনা
  const packageData = await Package.findById(salesRep.packageId).select("price durationInDays");
  if (!packageData) throw new ApiError(StatusCodes.NOT_FOUND, "Package not found");

  // 3️⃣ Subscription Data তৈরি করা
  const subscriptionData: Partial<ISubscription> = {
    user: new Types.ObjectId(salesRep.customerId),
    package: new Types.ObjectId(salesRep.packageId),
    price: packageData.price,
    customerId: salesRep.customerId.toString(),
    subscriptionId: "SALESREP_" + new Date().toISOString(),
    remaining: 0,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: (() => {
      const d = new Date();
      const duration = getDurationInDays(packageData.duration) || 30; // package অনুযায়ী দিন
      d.setDate(d.getDate() + duration);
      return d.toISOString();
    })(),
    trxId: "N/A",
    status: "active",
    source: "salesRep",
  };

  // 4️⃣ Subscription সেভ করা
  const subscription = await Subscription.create(subscriptionData);

  // 5️⃣ User এর subscription status আপডেট
  const user = await User.findByIdAndUpdate(
    salesRep.customerId,
    {
      subscription: SUBSCRIPTION_STATUS.ACTIVE,
      isUserWaiting: false,
    },
    { new: true, upsert: true, select: "fcmToken firstName lastName points referredInfo" }
  );

  // 6️⃣ SalesRep এর subscription status আপডেট
  await SalesRep.findByIdAndUpdate(
    id,
    { subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE, subscriptionStatusChangedDate: new Date() },
    { new: true, upsert: true }
  );

  // 7️⃣ Welcome Notifications পাঠানো
  if (user?.fcmToken) {
    await sendPushNotification(
      user.fcmToken,
      "Welcome to the app",
      "You have successfully subscribed to our app. We are excited to have you on board!"
    );
  }

  await sendNotification({
    userIds: [salesRep.customerId.toString()],
    title: "Welcome to the app",
    body: "You have successfully subscribed to our app. We are excited to have you on board!",
    type: NotificationType.WELCOME,
  });

  // 8️⃣ Real-time Event Emit করা
  io.emit(`salesActivation::${salesRep.customerId.toString()}`, { status: "active" });

  // 9️⃣ Referral Bonus Logic (20%)
  const referralResult = await Referral.findOne({
    referredUser: salesRep.customerId,
    completed: false,
  });

  if (referralResult) {
    const referrerId = referralResult.referrer;
    console.log("🚀 Processing referral for salesRep user:", salesRep.customerId);

    const subscriptionPrice = subscriptionData.price || 0;
    const referralPoints = Math.round(subscriptionPrice * 0.2);

    if (referralPoints > 0) {
      // Referrer এর points যোগ করা
      await User.findByIdAndUpdate(referrerId, {
        $inc: { points: referralPoints },
        $push: { referralBonusGivenFor: salesRep.customerId },
      });

      // Point Transaction তৈরি
      await PointTransaction.create({
        user: referrerId,
        type: "EARN",
        source: "REFERRAL",
        referral: referralResult._id,
        points: referralPoints,
        note: `Earned ${referralPoints} points from referral subscription (${salesRep.customerId})`,
      });

      // Referral Notification পাঠানো
      const referredUser = await User.findById(salesRep.customerId).select("firstName lastName");
      const referrerUser = await User.findById(referrerId).select("firstName lastName");

      const referredUserName = `${referredUser?.firstName || ""} ${referredUser?.lastName || ""}`.trim();
      const referrerUserName = `${referrerUser?.firstName || ""} ${referrerUser?.lastName || ""}`.trim();

      await sendNotification({
        userIds: [referrerId.toString()],
        title: "Referral Bonus Earned",
        body: `${referredUserName} has joined using your referral code. You earned ${referralPoints} points!`,
        type: NotificationType.REFERRAL,
      });

      await sendNotification({
        userIds: [salesRep.customerId.toString()],
        title: "Referral Applied",
        body: `You have joined using referral code of ${referrerUserName}.`,
        type: NotificationType.REFERRAL,
      });

      referralResult.completed = true;
      await referralResult.save();
    }
  }

  return subscription;
};

const deactivateAccount = async (id: string) => {
  const salesRep = await SalesRep.findByIdAndUpdate(id, {
    subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
    subscriptionStatusChangedDate: new Date(),
  }, { new: true, upsert: true });
  if (!salesRep) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Sales rep not found");
  }

  const user = await User.findById(salesRep.customerId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  user.subscription = SUBSCRIPTION_STATUS.INACTIVE;
  await user.save();
};

export const SalesRepService = {
  createSalesRepData,
  getSalesRepData,
  updateUserAcknowledgeStatus,
  generateToken,
  validateToken,
  activateAccount,
  deactivateAccount
};
