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
  console.log("🚀 createUserToDB called with payload:", payload);
  console.log("👤 Logged-in merchant:", loggedInUser);

  // 🔐 Only Merchant can create merchant staff
  if (loggedInUser.role !== USER_ROLES.MERCENT) {
    throw new ApiError(403, "Only merchant can create merchant users");
  }

  // 🔒 Ownership (সবসময় merchant-এর under)
  payload.createdBy = loggedInUser._id;
  payload.merchantId = loggedInUser._id;
  payload.isSubMerchant = true;
  console.log("🔑 Ownership fields set:", {
    createdBy: payload.createdBy,
    merchantId: payload.merchantId,
    isSubMerchant: payload.isSubMerchant,
  });

  // 🔒 Role validation
  if (payload.role) {
    if (!ALLOWED_MERCHANT_ROLES.includes(payload.role as USER_ROLES)) {
      console.log("❌ Invalid role provided:", payload.role);
      throw new ApiError(
        400,
        "Merchant can only create ADMIN_MERCENT or VIEW_MERCENT users"
      );
    }
  } else {
    payload.role = USER_ROLES.VIEW_MERCENT;
  }
  console.log("🛡 Role set:", payload.role);

  // 🔒 Default values
  payload.status = USER_STATUS.ACTIVE;
  payload.verified = true;
  payload.isRootMerchant = false;
  console.log("⚙ Default values set:", {
    status: payload.status,
    verified: payload.verified,
    isRootMerchant: payload.isRootMerchant,
  });

  // ✅ Generate customUserId
  payload.customUserId = await generateCustomUserId(USER_ROLES.MERCENT);
  console.log("🆔 Generated customUserId:", payload.customUserId);

  // ✅ Generate referenceId
  if (!payload.referenceId) {
    payload.referenceId = `REF-${Math.floor(10000 + Math.random() * 90000)}`;
  }
  console.log("🔖 Reference ID:", payload.referenceId);

  // 📝 Fetch merchant info from DB and auto-populate fields
  const merchantFromDB = await User.findById(loggedInUser._id).lean();
  if (!merchantFromDB) {
    throw new ApiError(404, "Merchant not found in database");
  }

  const infoFields = [
    "address",
    "businessName",
    "city",
    "country",
    "service",
    "about",
    "website",
    "photo",
    "profile",
  ];

  infoFields.forEach((field) => {
    if ((merchantFromDB as any)[field] !== undefined) {
      (payload as any)[field] = (merchantFromDB as any)[field];
    }
  });

  console.log("🏢 Info fields populated from merchant DB:", 
    infoFields.reduce((acc, f) => {
      acc[f] = (payload as any)[f];
      return acc;
    }, {} as any)
  );

  const user = await User.create(payload);
  console.log("✅ User created:", user);

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
  console.log("===== deleteUser START =====");
  console.log("Requested userId to delete:", userId);
  console.log("Logged in user:", loggedInUser);

  // 1️⃣ Initialize filter
  const filter: any = { _id: userId };

  // 2️⃣ MERCENT role হলে merchantId fetch
  let merchantId: string | null = null;
  if (loggedInUser.role === USER_ROLES.MERCENT) {
    const merchant = await User.findById(loggedInUser._id).select("merchantId");
    merchantId = merchant?.merchantId?.toString() || null;
    console.log("Fetched merchantId from DB:", merchantId);

    if (!merchantId) {
      console.warn(
        "⚠️ MERCENT user has no merchantId, cannot delete other users safely"
      );
    } else {
      filter.merchantId = merchantId;
      console.log("Applying merchantId filter:", merchantId);
    }
  }

  console.log("Final filter for deletion:", filter);

  // 3️⃣ Delete user
  const deleted = await User.findOneAndDelete(filter);

  if (!deleted) {
    console.log("❌ No user found or not authorized to delete");
    throw new ApiError(404, "User not found or not authorized");
  }

  console.log("✅ User deleted successfully:", deleted._id);
  console.log("===== deleteUser END =====");
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