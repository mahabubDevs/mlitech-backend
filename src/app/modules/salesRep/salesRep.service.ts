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

const createSalesRepData = async (user: JwtPayload) => {
  await SalesRep.create({
    customerId: user.id,
  });
};
const getSalesRepData = async (query: Record<string, unknown>) => {
  const baseQuery = SalesRep.find().populate(
    "customerId",
    "firstName lastName email phone  status"
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
  await SalesRep.findOneAndUpdate(
    { customerId: userId },
    {
      acknowledged: true,
      acknowledgeDate: new Date(),
    },
    { runValidators: true }
  );
};
const generateToken = async (userId: string) => {
  const user = await User.findById(userId).select("status");
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User not found!");
  }
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User not Active");
  }
  const token = generateCashToken();

  await SalesRep.findOneAndUpdate(
    { customerId: userId },
    {
      token,
      tokenGenerateDate: new Date(),
    },
    { runValidators: true }
  );
};
const validateToken = async (userId: string, token: string) => {
  const result = await SalesRep.findOne({ customerId: userId });

  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request");
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
};

export const SalesRepService = {
  createSalesRepData,
  getSalesRepData,
  updateUserAcknowledgeStatus,
  generateToken,
  validateToken,
};
