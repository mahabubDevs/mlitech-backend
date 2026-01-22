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
// import { sendOtp } from "../../../config/m3sms";
import { sendOtp } from "../../../config/veevoTechOtp";
import { generateCustomUserId } from "./user.utils";
import Referral from "../referral/referral.model";
import { sendNotification } from "../../../helpers/notificationsHelper";
import { NotificationType } from "../notification/notification.model";




interface IPackageWithId extends IPackage {
  _id: string;
  isFreeTrial?: boolean;
}

const createAdminToDB = async (payload: any): Promise<IUser> => {
  // check admin is exist or not;
  const isExistAdmin = await User.findOne({ email: payload.email });
  if (isExistAdmin) {
    throw new ApiError(StatusCodes.CONFLICT, "This Email already taken");
  }
  // create admin data
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

  // ✅ If verified user exists → throw error (same as old logic)
  if ((isExitByEmail && isExitByEmail.verified) || (isExitByPhone && isExitByPhone.verified)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User Already Exist");
  }

  let user: IUser | null = null;

// Update
if (isExitByEmail || isExitByPhone) {
  const existingUser = isExitByEmail || isExitByPhone;
  user = await User.findByIdAndUpdate(existingUser._id, payload, { new: true });
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update existing user");
  }
} else {
  // Create
  const referenceId = await createUniqueReferralId();
  const customUserId = await generateCustomUserId(payload.role as string);

  const userData = {
    ...payload,
    referenceId,
    customUserId,
    status:
      payload.role === USER_ROLES.MERCENT
        ? USER_STATUS.INACTIVE
        : USER_STATUS.ACTIVE,
    ...(payload.role === USER_ROLES.MERCENT && {
      approveStatus: APPROVE_STATUS.PENDING,
    }),
  };

  user = await User.create(userData);
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create user");
  }
}


  // 4️⃣ Handle referral if exists
  if (payload?.referredId && !user.referredInfo) {
    const referrer = await User.findOne({ referenceId: payload.referredId });
    if (!referrer) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Referred Id Invalid!");
    }

    const referredInfo = {
      referredId: payload.referredId,
      referredBy: `${referrer.firstName} ${referrer.lastName || ""}`,
    };

    await User.findByIdAndUpdate(user._id, { $set: { referredInfo } });

    await Referral.create({
      referrer: referrer._id,
      referredUser: user._id,
    });
  }

  // 5️⃣ Generate OTP
  const otp = generateOTP();

  // 6️⃣ Save OTP to DB
  await User.findByIdAndUpdate(user._id, {
    $set: {
      "authentication.phoneOTP": {
        code: otp,
        expireAt: new Date(Date.now() + 3 * 60000), // 3 min
      },
    },
  });

  console.log("Generated OTP for user:", otp);

  // 7️⃣ Send OTP via VeevoTech API
  if (user.phone) {
    try {
      await sendOtp(user.phone, otp.toString());
      console.log(`OTP sent to phone: ${user.phone}`);
    } catch (error) {
      console.error("Failed to send OTP via VeevoTech:", error);
    }
  } else {
    console.warn("⚠️ No phone number found for user:", user._id);
  }

  // 8️⃣ Notify Super Admin
  const superAdmin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN }).select("_id");
  if (superAdmin) {
    sendNotification({
      userIds: [superAdmin._id.toString()],
      title: "A new user has registered/updated",
      body: `User ${user.firstName} has registered or updated with the role ${user.role}.`,
      type: NotificationType.SYSTEM,
    });
  }

  return user;
};




const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<
  Partial<IUser> & {
    subscriptions: any[];
    totalSubscriptions: number;
    hasUsedFreePlan: boolean;
  }
> => {
  const { _id } = user;

  const isExistUser: any = await User.isExistUserById(_id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const subscriptions = await Subscription.find({ user: _id }).populate<{
    package: IPackageWithId | null;
  }>({
    path: "package",
    select: "title price duration isFreeTrial",
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

  // 🔥 Check free plan usage
  const hasUsedFreePlan = subscriptions.some(
    (sub) => sub.package?.isFreeTrial === true
  );

  return {
    ...isExistUser.toObject(),
    subscriptions: formattedSubscriptions,
    totalSubscriptions: subscriptions.length,
    hasUsedFreePlan, // ✅ NEW FIELD
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

  // unlink old files
  if (payload.profile && isExistUser.profile) {
    unlinkFile(isExistUser.profile);
  }

  if (payload.photo && isExistUser.photo) {
    unlinkFile(isExistUser.photo);
  }

  try {
    const updateDoc = await User.findOneAndUpdate(
      { _id },
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    return updateDoc;
  } catch (error: any) {
    /* -----------------------------
       🔴 Handle Duplicate Key Error
    ------------------------------*/
    if (error?.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];

      throw new ApiError(
        StatusCodes.CONFLICT,
        `This ${field} already exists`
      );
    }

    throw error;
  }
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
