import { APPROVE_STATUS, USER_ROLES, USER_STATUS } from "../../../enums/user";
import { CreateUserPayload, IUser } from "./user.interface";
import { JwtPayload } from "jsonwebtoken";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import generateOTP from "../../../util/generateOTP";
import { emailTemplate } from "../../../shared/emailTemplate";
import { emailHelper } from "../../../helpers/emailHelper";
import unlinkFile from "../../../shared/unlinkFile";
import { NotificationService } from "../notification/notification.service";

import { last } from "pdf-lib";
import { Subscription } from "../subscription/subscription.model";
import { IPackage } from "../shopAuraSubscription/aurashop.interface";

import { createUniqueReferralId } from "../../../util/generateRefferalId";
import { sendOtp } from "../../../config/veevoTechOtp";
import { generateCustomUserId } from "./user.utils";

interface IPackageWithId extends IPackage {
  _id: string;
}

const createAdminToDB = async (payload: any): Promise<IUser> => {
  // check admin is exist or not;
  const isExistAdmin = await User.findOne({ email: payload.email });
  if (isExistAdmin) {
    throw new ApiError(StatusCodes.CONFLICT, "This Email already taken");
  }
  const referenceId = await createUniqueReferralId();
  const adminData = {
    ...payload,
    referenceId,
  };
  // create admin to db
  const createAdmin = await User.create(adminData);
  if (!createAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create Admin");
  } else {
    await User.findByIdAndUpdate(
      { _id: createAdmin?._id },
      { verified: true },
      { new: true }
    );
  }

  return createAdmin;
};

const createUserToDB = async (payload: CreateUserPayload): Promise<IUser> => {
  // 1️⃣ Check if user exists
  const isExitByEmail = await User.isExistUserByEmail(payload.email as string);
  const isExitByPhone = await User.isExistUserByPhone(payload.phone as string);

  if (isExitByEmail || isExitByPhone) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User Already Exist");
  }





  // 2️⃣ Create user data
  const referenceId = await createUniqueReferralId();
  const customUserId = await generateCustomUserId(payload.role as string);

  let referredInfo;
  if (payload?.referredId) {
    const referredUser = await User.findOne({ referenceId: payload.referredId });
    if (!referredUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Referred Id Invalied!");
    }
    referredInfo = {
      referredId: payload.referredId,
      referredBy: `${referredUser.firstName} + " " + ${referredUser?.lastName ? referredUser?.lastName : ""}`,
    };
  }

  const userData = {
    ...payload,
    referenceId,
    customUserId,
    referredInfo,
    status:
      payload.role === USER_ROLES.MERCENT
        ? USER_STATUS.INACTIVE
        : USER_STATUS.ACTIVE,

    ...(payload.role === USER_ROLES.MERCENT && {
      approveStatus: APPROVE_STATUS.PENDING,
    }),
  };

  const createUser = await User.create(userData);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create user");
  }

  // 3️⃣ Generate OTP
  const otp = generateOTP();

  // 4️⃣ Save OTP to DB
  await User.findByIdAndUpdate(createUser._id, {
    $set: {
      "authentication.phoneOTP": {
        code: otp,
        expireAt: new Date(Date.now() + 3 * 60000), // 3 min
      },
    },
  });

  console.log("Generated OTP for user:", otp);

  // 5️⃣ Send OTP via VeevoTech API
  if (createUser.phone) {
    try {
      await sendOtp(createUser.phone, otp.toString());
      console.log(`OTP sent to phone: ${createUser.phone}`);
    } catch (error) {
      console.error("Failed to send OTP via VeevoTech:", error);
    }
  } else {
    console.warn("⚠️ No phone number found for user:", createUser._id);
  }

  return createUser;
};



const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser> & { totalPigeons: number; subscriptions: any[] }> => {
  const { _id } = user;

  // 1️⃣ Check if user exists
  const isExistUser: any = await User.isExistUserById(_id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // 2️⃣ Count total pigeons (pages array)

  // populate er por type define kora holo
  const subscriptions = await Subscription.find({ user: _id }).populate<{
    package: IPackageWithId | null;
  }>({
    path: "package",
    select: "title price duration",
  });

  const formattedSubscriptions = subscriptions.map((sub) => ({
    subscriptionId: sub._id,
    packageId: sub.package?._id || null,
    packageTitle: sub.package?.title || "Deleted Package",
    price: sub.price,
    duration: sub.package?.duration || "N/A",
    startDate: sub.currentPeriodStart,
    endDate: sub.currentPeriodEnd,
    status: sub.status,
    trxId: sub.trxId,
    subscriptionStripeId: sub.subscriptionId,
  }));
  // 5️⃣ Total subscriptions
  const totalSubscriptions = subscriptions.length;
  // 5️⃣ Return combined profile + subscriptions + totalPigeons
  return {
    ...isExistUser.toObject(),

    subscriptions: formattedSubscriptions,
    totalSubscriptions,
  };
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { _id } = user;
  const isExistUser = await User.isExistUserById(_id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.profile) {
    unlinkFile(isExistUser.profile);
  }
  if (payload.photo) {
    unlinkFile(isExistUser.photo);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: _id }, payload, {
    new: true,
    runValidators: true,
  });

  return updateDoc;
};

const getUserOnlineStatusFromDB = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const now = new Date();
  const diffMinutes = (now.getTime() - user.lastActive.getTime()) / 1000 / 60;

  const isOnline = diffMinutes <= 5; // 5 মিনিটের মধ্যে active হলে online

  return {
    userId: user._id.toString(),
    name: user.firstName + " " + user.lastName,
    isOnline,
    lastActive: user.lastActive,
    lastActiveMinutesAgo: Math.floor(diffMinutes),
  };
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  createAdminToDB,
  getUserOnlineStatusFromDB,
};
