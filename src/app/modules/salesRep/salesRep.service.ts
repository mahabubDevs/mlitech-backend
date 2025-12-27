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

const createSalesRepData = async (user: JwtPayload, packageId: string) => {

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 🔍 Check if SalesRep exists in last 7 days
  const existingSalesRep = await SalesRep.findOne({
    customerId: user._id,
    createdAt: { $gte: sevenDaysAgo },
  });

  if (existingSalesRep) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Sales representative already created within last 7 days"
    );
  }

  await SalesRep.create({
    customerId: user._id,
    packageId,
  });

  const admins = await User.find({ role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] } }).select("_id");

  await sendNotification({
    userIds: admins.map((admin) => admin._id),
    title: "New customer added in sales rep",
    body: "A customer requested to make payment by sales rep.",
    type: NotificationType.SYSTEM,
  });

};
const getSalesRepData = async (query: Record<string, unknown>) => {
  const baseQuery = SalesRep.find().populate(
    "customerId",
    "firstName lastName email phone  status lastStatusChanged"
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

const updateUserAcknowledgeStatus = async (userId: string) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const result = await SalesRep.findOneAndUpdate(
    { customerId: new Types.ObjectId(userId), createdAt: { $gte: sevenDaysAgo } },
    {
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
};
const generateToken = async (userId: string, adminId: string) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const user = await User.findById(userId).select("status");

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User is not active");
  }

  const token = generateCashToken();


  const adminName = await User.findById(adminId).select("firstName lastName");

  const result = await SalesRep.findOneAndUpdate(
    { customerId: new Types.ObjectId(userId), createdAt: { $gte: sevenDaysAgo } },
    {
      token,
      tokenGenerateDate: new Date(),
      adminName: `${adminName?.firstName} ${adminName?.lastName ?? ""}`.trim(),
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
    await PointTransaction.create({
      user: userId,
      type: "EARN",
      source: "REFERRAL",
      referral: referralResult._id,
      points: 10,
      note: "Referral points",
    })
    await PointTransaction.create({
      user: referralResult.referrer,
      type: "EARN",
      source: "REFERRAL",
      referral: referralResult._id,
      points: 10,
      note: "Referral points",
    })

    await User.findByIdAndUpdate(
      referralResult.referrer,
      { $inc: { points: 10 } },
      { new: true }
    );

    await User.findByIdAndUpdate(
      userId,
      { $inc: { points: 10 } },
      { new: true }
    );

    await sendNotification({ userIds: [referralResult.referrer.toString()], title: "Referral points", body: "You have earned 10 points for referring a new user", type: NotificationType.REFERRAL });
    await sendNotification({ userIds: [userId.toString()], title: "Referral points", body: "You have earned 10 points for using referral code", type: NotificationType.REFERRAL });
    referralResult.completed = true;
    await referralResult.save();
  }


};

export const SalesRepService = {
  createSalesRepData,
  getSalesRepData,
  updateUserAcknowledgeStatus,
  generateToken,
  validateToken,
};
