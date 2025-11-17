import { USER_ROLES } from "../../../enums/user";
import { IUser } from "./user.interface";
import { JwtPayload } from 'jsonwebtoken';
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
import { sendOtp } from "../../../shared/twilioService";

interface IPackageWithId extends IPackage {
  _id: string;
}

const createAdminToDB = async (payload: any): Promise<IUser> => {

    // check admin is exist or not;
    const isExistAdmin = await User.findOne({ email: payload.email })
    if (isExistAdmin) {
        throw new ApiError(StatusCodes.CONFLICT, "This Email already taken");
    }

    // create admin to db
    const createAdmin = await User.create(payload);
    if (!createAdmin) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
    } else {
        await User.findByIdAndUpdate({ _id: createAdmin?._id }, { verified: true }, { new: true });
    }

    return createAdmin;
}

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create user");
  }

  // Generate OTP
  const otp = generateOTP();

  // Save OTP to DB
  await User.findByIdAndUpdate(createUser._id, {
    $set: {
      "authentication.phoneOTP": {
        code: otp,
        expireAt: new Date(Date.now() + 3 * 60000), // 3 minutes validity
      },
    },
  });

  console.log("Generated OTP for user:", otp)  // Send OTP to user's phone
  // if (createUser.phoneNumber) {
  //   // sendOtp expects string arguments, ensure OTP is converted to string
  //   await sendOtp(createUser.phoneNumber, String(otp));
  // } else {
  //   console.warn("⚠️ No phone number found for user:", createUser._id);
  // }


  return createUser ;
};



const getUserProfileFromDB = async (user: JwtPayload): Promise<Partial<IUser> & { totalPigeons: number, subscriptions: any[] }> => {
    const { _id } = user;

    // 1️⃣ Check if user exists
    const isExistUser: any = await User.isExistUserById(_id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    // 2️⃣ Count total pigeons (pages array)




   // populate er por type define kora holo
const subscriptions = await Subscription.find({ user: _id }).populate<{ package: IPackageWithId | null }>({
    path: "package",
    select: "title price duration",
});

const formattedSubscriptions = subscriptions.map(sub => ({
    subscriptionId: sub._id,
    packageId: sub.package?._id || null,
    packageTitle: sub.package?.title || "Deleted Package",
    price: sub.price,
    duration: sub.package?.duration || "N/A",
    startDate: sub.currentPeriodStart,
    endDate: sub.currentPeriodEnd,
    status: sub.status,
    trxId: sub.trxId,
    subscriptionStripeId: sub.subscriptionId
}));
// 5️⃣ Total subscriptions
  const totalSubscriptions = subscriptions.length;
    // 5️⃣ Return combined profile + subscriptions + totalPigeons
    return {
        ...isExistUser.toObject(),
     
        subscriptions: formattedSubscriptions,
        totalSubscriptions
    };
};


const updateProfileToDB = async (user: JwtPayload, payload: Partial<IUser>): Promise<Partial<IUser | null>> => {
    const { _id } = user;
    const isExistUser = await User.isExistUserById(_id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    //unlink file here
    if (payload.profile) {
        unlinkFile(isExistUser.profile);
    }

    const updateDoc = await User.findOneAndUpdate(
        { _id: _id },
        payload,
        { new: true }
    );
    console.log("updateDoc", updateDoc);
    return updateDoc;
};

 const getUserOnlineStatusFromDB = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const diffMinutes = (now.getTime() - user.lastActive.getTime()) / 1000 / 60;

  const isOnline = diffMinutes <= 5; // 5 মিনিটের মধ্যে active হলে online

  return {
    userId: user._id.toString(),
    name: user.firstName + ' ' + user.lastName,
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
    getUserOnlineStatusFromDB
};