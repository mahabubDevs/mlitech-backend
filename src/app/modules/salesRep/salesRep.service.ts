import { JwtPayload } from "jsonwebtoken";
import { SalesRep } from "./salesRep.model";
import { User } from "../user/user.model";
import QueryBuilder from "../../../util/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { USER_STATUS } from "../../../enums/user";
import { generateCashToken } from "../../../util/generateCashToken";
import { ISubscription } from "../subscription/subscription.interface";
import { Types } from "mongoose";
import { Subscription } from "../subscription/subscription.model";
import { Package } from "../package/package.model";

const createSalesRepData = async (user: JwtPayload, packageId: string) => {
  await SalesRep.create({
    customerId: user._id,
    packageId,
  });

  await User.findByIdAndUpdate(user._id, { status: USER_STATUS.INACTIVE });
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
  const result = await SalesRep.findOneAndUpdate(
    { customerId: new Types.ObjectId(userId) },
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
    { customerId: new Types.ObjectId(userId) },
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
  const result = await SalesRep.findOne({ customerId: userId, token });

  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request");
  }
  if (result.paymentStatus === "paid") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Already Validated");
  }
  if (result.token !== token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Token");
  }

  result.paymentStatus = "paid";
  await result.save();

  await User.findByIdAndUpdate(
    userId,
    { subscription: "active" },
    { new: true }
  );
  const existingPackage = await Package.findById(result.packageId);

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
  };
  await Subscription.create({ ...subscriptionData });
};

export const SalesRepService = {
  createSalesRepData,
  getSalesRepData,
  updateUserAcknowledgeStatus,
  generateToken,
  validateToken,
};
