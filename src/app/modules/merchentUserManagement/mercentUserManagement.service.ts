// আগের function

import { USER_ROLES, USER_STATUS } from "../../../enums/user";
import ApiError from "../../../errors/ApiErrors";
import QueryBuilder from "../../../util/queryBuilder";
import { IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { generateCustomUserId } from "../user/user.utils";



const ALLOWED_MERCHANT_ROLES = [
  USER_ROLES.ADMIN_MERCENT,
  USER_ROLES.VIEW_MERCENT,
];

const createUserToDB = async (
  payload: Partial<IUser>,
  loggedInUser: any
) => {
  // 🔐 Only Merchant can create merchant staff
  if (loggedInUser.role !== USER_ROLES.MERCENT) {
    throw new ApiError(403, "Only merchant can create merchant users");
  }

  // 🔒 Ownership (সবসময় merchant-এর under)
  payload.createdBy = loggedInUser._id;
  payload.merchantId = loggedInUser._id; // 🔴 FIXED
  payload.isSubMerchant = true;          // 🔴 IMPORTANT FLAG

  // 🔒 Role validation
  if (payload.role) {
    if (!ALLOWED_MERCHANT_ROLES.includes(payload.role as USER_ROLES)) {
      throw new ApiError(
        400,
        "Merchant can only create ADMIN_MERCENT or VIEW_MERCENT users"
      );
    }
  } else {
    payload.role = USER_ROLES.VIEW_MERCENT;
  }

  // 🔒 Default values
  payload.status = USER_STATUS.ACTIVE;
  payload.verified = true;

  // ❌ Staff user কখনো root merchant হবে না
  payload.isRootMerchant = false;

  // ✅ Generate customUserId
  payload.customUserId = await generateCustomUserId(USER_ROLES.MERCENT);

  // ✅ Generate referenceId
  if (!payload.referenceId) {
    payload.referenceId = `REF-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  const user = await User.create(payload);
  return user.toObject();
};



// ---------------- Get Users By Merchant ----------------
const getUsersByMerchant = async (loggedInUser: any, query: Record<string, any>) => {
  const creatorId = loggedInUser.id || loggedInUser._id;

  if (!creatorId) {
    throw new ApiError(400, "Invalid logged in user");
  }

  // Initialize QueryBuilder with base query
  const queryBuilder = new QueryBuilder(
    User.find({ createdBy: creatorId }).lean(),
    query
  );

  // Apply query features
  queryBuilder
    .search(['name', 'email']) // Add other searchable fields if needed
    .filter()
    .sort()
    .fields()
    .paginate();

  // Execute query
  const users = await queryBuilder.modelQuery;

  // Get pagination info
  const paginationInfo = await queryBuilder.getPaginationInfo();

  return { users, paginationInfo };
};

// ---------------- Get Single User ----------------
const getSingleUser = async (userId: string, loggedInUser: any) => {
  const creatorId = loggedInUser.id || loggedInUser._id;

  if (!creatorId) {
    throw new ApiError(400, "Invalid logged in user");
  }

  // 🔥 Only fetch user created by this merchant
  const user = await User.findOne({
    _id: userId,
    createdBy: creatorId,
  }).lean();

  if (!user) {
    throw new ApiError(404, "User not found or not authorized");
  }

  return user;
};

// ---------------- Update User ----------------
const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  loggedInUser: any
) => {
  const creatorId = loggedInUser.id || loggedInUser._id;

  if (!creatorId) {
    throw new ApiError(400, "Invalid logged in user");
  }

  // 🔒 Prevent changing ownership
  delete payload.createdBy;
  delete payload.merchantId;

  // 🔒 Role validation
  if (payload.role && !ALLOWED_MERCHANT_ROLES.includes(payload.role as USER_ROLES)) {
    throw new ApiError(
      400,
      "Merchant can only assign MERCENT or VIEW_MERCENT roles"
    );
  }

  // 🔒 Find user created by this merchant
  const filter = { _id: userId, createdBy: creatorId };

  const updatedUser = await User.findOneAndUpdate(filter, payload, { new: true }).lean();

  if (!updatedUser) {
    throw new ApiError(404, "User not found or not authorized");
  }

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
  const creatorId = loggedInUser.id || loggedInUser._id;

  if (!creatorId) {
    throw new ApiError(400, "Invalid logged in user");
  }

  // 🔒 Only toggle users created by this merchant
  const user = await User.findOne({ _id: userId, createdBy: creatorId });

  if (!user) {
    throw new ApiError(404, "User not found or not authorized");
  }

  // 🔄 Toggle status
  user.status = user.status === USER_STATUS.ACTIVE
    ? USER_STATUS.INACTIVE
    : USER_STATUS.ACTIVE;

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