import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { User } from "../user/user.model";
import { USER_STATUS } from "../../../enums/user";


// ✅ Get All Users
const getAllUsers = async () => {
  const users = await User.find();
  return users;
};

// ✅ Get Single User
const getSingleUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  return user;
};

// ✅ View Report (demo)
const viewReport = async (id: string) => {
  const user = await User.findById(id).select("firstName lastName email role status");
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // এখানে তুমি তোমার আসল রিপোর্ট লজিক বসাবে
  return {
    user,
    report: {
      lastLogin: new Date(),
      totalCalls: 25,
      successfulCalls: 20,
      failedCalls: 5,
    },
  };
};

// ✅ Active / Inactive User
const activeInactiveUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // status toggle logic
  if (user.status === USER_STATUS.ACTIVE) {
    user.status = USER_STATUS.BLOCK;
  } else if (user.status === USER_STATUS.BLOCK) {
    user.status = USER_STATUS.ACTIVE;
  } else if (user.status === USER_STATUS.ARCHIVE) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Archived users cannot be reactivated");
  }

  await user.save();
  return user;
};

export const UserService = {
  getAllUsers,
  getSingleUser,
  viewReport,
  activeInactiveUser,
};
