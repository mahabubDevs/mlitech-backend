// আগের function

import { USER_ROLES, USER_STATUS } from "../../../enums/user";
import ApiError from "../../../errors/ApiErrors";
import { IUser } from "../user/user.interface";
import { User } from "../user/user.model";





// ---------------- Get Users By Merchant ----------------
 const getUsersByMerchant = async (loggedInUser: any) => {
  const filter: any = {};
  if (loggedInUser.role === USER_ROLES.MERCENT) {
    filter.merchantId = loggedInUser.id;
  }

  return await User.find(filter).lean();
};

// ---------------- Get Single User ----------------
 const getSingleUser = async (userId: string, loggedInUser: any) => {
  const user = await User.findOne({
    _id: userId,
    merchantId: loggedInUser.role === USER_ROLES.MERCENT ? loggedInUser.id : undefined,
  }).lean();

  if (!user) throw new ApiError(404, "User not found");
  return user;
};

// ---------------- Update User ----------------
 const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  loggedInUser: any
) => {
  const filter: any = { _id: userId };
  if (loggedInUser.role === USER_ROLES.MERCENT) filter.merchantId = loggedInUser.id;

  const updatedUser = await User.findOneAndUpdate(filter, payload, { new: true }).lean();
  if (!updatedUser) throw new ApiError(404, "User not found or not authorized");
  return updatedUser;
};

// ---------------- Delete User ----------------
 const deleteUser = async (userId: string, loggedInUser: any) => {
  const filter: any = { _id: userId };
  if (loggedInUser.role === USER_ROLES.MERCENT) filter.merchantId = loggedInUser.id;

  const deleted = await User.findOneAndDelete(filter);
  if (!deleted) throw new ApiError(404, "User not found or not authorized");
  return true;
};

// ---------------- Toggle Active/Inactive ----------------
 const toggleUserStatus = async (userId: string, loggedInUser: any) => {
  const filter: any = { _id: userId };
  if (loggedInUser.role === USER_ROLES.MERCENT) filter.merchantId = loggedInUser.id;

  const user = await User.findOne(filter);
  if (!user) throw new ApiError(404, "User not found or not authorized");

  user.status = user.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE;
  await user.save();

  return { id: user._id, status: user.status };
};


export const UserService = {
    createUserToDB,
    getUsersByMerchant,
    getSingleUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
};