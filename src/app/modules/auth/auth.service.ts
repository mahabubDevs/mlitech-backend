import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiErrors';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import jwt from 'jsonwebtoken';
import {
  IAuthResetPassword,
  IChangePassword,
  ILoginData,
  IVerifyEmail,
  IVerifyPhone
} from '../../../types/auth';
import cryptoToken from '../../../util/cryptoToken';
import generateOTP from '../../../util/generateOTP';
import { ResetToken } from '../resetToken/resetToken.model';
import { User } from '../user/user.model';
import { IUser } from '../user/user.interface';
import { sendOtp } from '../../../config/veevoTechOtp';
import { SUBSCRIPTION_STATUS, USER_ROLES, USER_STATUS } from '../../../enums/user';
import { OAuth2Client } from 'google-auth-library';
import { createUniqueReferralId } from '../../../util/generateRefferalId';
import { generateCustomUserId } from '../user/user.utils';








//login
const loginUserFromDB = async (payload: ILoginData) => {
  const { identifier, password } = payload;

  // 1️⃣ Find user by email or phone
  const user: any = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  }).select('+password');

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // 2️⃣ Check verified
  if (!user.verified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please verify your account before login');
  }

  // 3️⃣ Check password match
  if (password && !(await User.isMatchPassword(password, user.password))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect!');
  }


  // if (user.role === USER_ROLES.USER && user.subscription !== SUBSCRIPTION_STATUS.ACTIVE) {
  //   throw new ApiError(StatusCodes.BAD_REQUEST, "You are not subscribed");
  // }
  // 4️⃣ Status check
  switch (user.status) {
    case USER_STATUS.ACTIVE:




      // create tokens
      const accessToken = jwtHelper.createToken(
        { id: user._id, role: user.role, email: user.email },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string
      );

      const refreshToken = jwtHelper.createToken(
        { id: user._id, role: user.role, email: user.email },
        config.jwt.jwtRefreshSecret as Secret,
        config.jwt.jwtRefreshExpiresIn as string
      );

      // ✅ Save latest token to DB
    await User.findByIdAndUpdate(user._id, { latestToken: accessToken });

      return {
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          pages: user.pages || [],
          subscription: user.subscription,
          isUserWaiting: user.isUserWaiting,
          location: user.location ?? {
            type: 'Point',
            coordinates: [0, 0],
          },


        }
      };

    case USER_STATUS.ARCHIVE:
      throw new ApiError(StatusCodes.BAD_REQUEST, "Your account is archived. Please verify your account first");

    case USER_STATUS.BLOCK:
      throw new ApiError(StatusCodes.FORBIDDEN, "You are blocked. Contact admin.");

    default:
      throw new ApiError(StatusCodes.BAD_REQUEST, "Please verify your account for admin approval");
  }
};

//forget password
const forgetPasswordToDB = async (identifier: string) => {
  const isEmail = identifier.includes("@");

  // 1️⃣ Find user by email or phone
  const user = isEmail
    ? await User.findOne({ email: identifier })
    : await User.findOne({ phone: identifier });

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // 2️⃣ Generate OTP
  const otp = generateOTP();

  user.authentication = user.authentication || {};
  user.authentication.isResetPassword = true;

  if (isEmail) {
    // 📧 Email OTP
    user.authentication.emailOTP = {
      code: otp,
      expireAt: new Date(Date.now() + 3 * 60000),
    };
    user.authentication.resetVia = "email";
  } else {
    // 📱 Phone OTP
    user.authentication.phoneOTP = {
      code: otp,
      expireAt: new Date(Date.now() + 3 * 60000),
    };
    user.authentication.resetVia = "phone";
  }

  await user.save();

  // 3️⃣ Send OTP
  if (isEmail) {
    const values = {
      name: user.firstName ?? "",
      lastName: user.lastName ?? "",
      otp: otp,
      email: user.email ?? ""
    };

    const resetPasswordTemplate = emailTemplate.resetPassword(values);
    await emailHelper.sendEmail(resetPasswordTemplate);
  } else {
    // Phone OTP (existing system)
    await sendOtp(user.phone!, otp.toString());
  }

  return {
    identifier,
    via: user.authentication.resetVia,
  };
};





//verify email
// const verifyEmailToDB = async (payload: IVerifyEmail) => {
//   const { email, oneTimeCode } = payload;

//   // 1️⃣ Find user with authentication
//   const user = await User.findOne({ email }).select('+authentication');
//   if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");

//   // 2️⃣ Validate OTP
//   if (!oneTimeCode || isNaN(Number(oneTimeCode))) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Please provide a valid OTP sent to your email');
//   }

//   const otpNumber = Number(oneTimeCode);

//   if (user.authentication?.emailOTP?.code !== otpNumber) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'You provided wrong OTP');
//   }

//   if (!user.authentication?.emailOTP?.expireAt || user.authentication.emailOTP.expireAt < new Date()) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP already expired, please request a new one');

//   }

//     if (user.status !== USER_STATUS.ACTIVE) {
//     user.status = USER_STATUS.ACTIVE;
//   }

//   let message: string;
//   let data: any;



//   // 3️⃣ First-time verification
//   if (!user.emailVerified) {
//     await User.findByIdAndUpdate(user._id, {
//       emailVerified: true,
//       "authentication.emailOTP.code": null,
//       "authentication.emailOTP.expireAt": null,
//     });

//     // ✅ Generate accessToken
//     const accessToken = jwtHelper.createToken(
//       { id: user._id, role: user.role, email: user.email },
//       config.jwt.jwt_secret as Secret,
//       config.jwt.jwt_expire_in as string
//     );

//     message = 'Email verified successfully';
//     data = { accessToken };

//   } else {
//     // 4️⃣ Already verified → reset password flow
//     await User.findByIdAndUpdate(user._id, {
//       "authentication.emailOTP.code": null,
//       "authentication.emailOTP.expireAt": null,
//       "authentication.isResetPassword": true,
//     });

//     const accessToken = jwtHelper.createToken(
//       { id: user._id, role: user.role, email: user.email },
//       config.jwt.jwt_secret as Secret,
//       config.jwt.jwt_expire_in as string
//     );

//     const resetToken = cryptoToken();
//     await ResetToken.create({
//       user: user._id,
//       token: resetToken,
//       expireAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
//     });

//     message = 'Verification Successful: Please securely store and utilize this code for reset password';
//     data = { accessToken, resetToken };
//   }

//   return { message, data };
// };





// verifyPhoneOtpToDB.ts
const verifyOtpToDB = async (payload: { identifier: string, oneTimeCode: number }) => {
  const { identifier, oneTimeCode } = payload;

  const isEmail = identifier.includes("@");

  // 1️⃣ Find user by email or phone
  const user = isEmail
    ? await User.findOne({ email: identifier }).select("+authentication")
    : await User.findOne({ phone: identifier }).select("+authentication");

  if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");

  // 2️⃣ Validate OTP
  if (!oneTimeCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please provide OTP sent to your identifier");
  }

  const otpInfo = isEmail ? user.authentication?.emailOTP : user.authentication?.phoneOTP;

  if (!otpInfo || otpInfo.code !== oneTimeCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You provided wrong OTP");
  }

  if (!otpInfo.expireAt || otpInfo.expireAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "OTP already expired, request new one");
  }

  // 3️⃣ Mark verified & clear OTP
  if (!user.verified) user.verified = true;

  if (user.authentication) {
    if (isEmail) delete user.authentication.emailOTP;
    else delete user.authentication.phoneOTP;

    user.authentication.isResetPassword = true; // allow reset flow
  } else {
    user.authentication = { isResetPassword: true } as any;
  }

  await user.save();

  // 4️⃣ Generate JWT access token
  const accessToken = jwtHelper.createToken(
    { id: user._id, role: user.role, email: user.email, phoneNumber: user.phone },
    config.jwt.jwt_secret!,
    config.jwt.jwt_expire_in!
  );

  // 5️⃣ Generate reset token (for password reset)
  const resetToken = cryptoToken();
  await ResetToken.create({
    user: user._id,
    token: resetToken,
    expireAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
  });

  return { message: "OTP verified successfully", accessToken, resetToken };
};





//forget password
const resetPasswordToDB = async (token: string, payload: IAuthResetPassword) => {

  const { newPassword, confirmPassword } = payload;
  console.log("Resetting password with token:", token);

  //isExist token
  const isExistToken = await ResetToken.isExistToken(token);
  if (!isExistToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
  }

  //user permission check
  const isExistUser = await User.findById(isExistToken.user).select('+authentication');
  if (!isExistUser?.authentication?.isResetPassword) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "You don't have permission to change the password. Please click again to 'Forgot Password'");
  }

  //validity check
  const isValid = await ResetToken.isExpireToken(token);
  if (!isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Token expired, Please click again to the forget password');
  }

  //check password
  if (newPassword !== confirmPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "New password and Confirm password doesn't match!");
  }

  const isSamePassword = await bcrypt.compare(newPassword, isExistUser.password || '');
  if (isSamePassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please provide a different password from the previous one');
  }

  const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

  const updateData = {
    password: hashPassword,
    authentication: {
      isResetPassword: false,
    }
  };

  await User.findOneAndUpdate(
    { _id: isExistToken.user },
    updateData,
    { new: true }
  );
};

const changePasswordToDB = async (user: JwtPayload, payload: IChangePassword) => {

  console.log("Step 1: User payload", user);

  const { currentPassword, newPassword, confirmPassword } = payload;
  const isExistUser = await User.findById(user._id).select('+password');
  console.log("Step 2: Found user", isExistUser);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //current password match
  if (
    currentPassword &&
    !(await User.isMatchPassword(currentPassword, isExistUser.password as string))
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
  }

  //newPassword and current password
  if (currentPassword === newPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please give different password from current password');
  }

  //new password and confirm password check
  if (newPassword !== confirmPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
  }

  //hash password
  const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

  const updateData = {
    password: hashPassword,
  };

  await User.findOneAndUpdate({ _id: user._id }, updateData, { new: true });
};


const newAccessTokenToUser = async (token: string) => {

  // Check if the token is provided
  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required!');
  }

  const verifyUser = jwtHelper.verifyToken(
    token,
    config.jwt.jwtRefreshSecret as Secret
  );

  const isExistUser = await User.findById(verifyUser?.id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access")
  }

  //create token
  const accessToken = jwtHelper.createToken(
    { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  return { accessToken }
}

// const resendVerificationEmailToDB = async (email: string) => {
//   // 1️⃣ Find the user
//   const existingUser = await User.findOne({ email }).select('+authentication');
//   if (!existingUser) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'User with this email does not exist!');
//   }

//   if (existingUser.emailVerified) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already verified!');
//   }

//   // 2️⃣ Generate OTP
//   const otp = generateOTP();
//   const emailValues = {
//     name: existingUser.firstName ?? '', 
//   otp,
//   email: existingUser.email ?? '',
//   };

//   const accountEmailTemplate = emailTemplate.createAccount(emailValues);
//   emailHelper.sendEmail(accountEmailTemplate);

//   // 3️⃣ Save OTP to emailOTP nested field
//   await User.findByIdAndUpdate(
//     existingUser._id,
//     {
//       "authentication.emailOTP.code": otp,
//       "authentication.emailOTP.expireAt": new Date(Date.now() + 3 * 60 * 1000) // 3 min
//     },
//     { new: true }
//   );
// };


// social authentication
// const socialLoginFromDB = async (payload: IUser) => {

//     const { appId, role } = payload;

//     const isExistUser = await User.findOne({ appId });

//     if (isExistUser) {

//         //create token
//         const accessToken = jwtHelper.createToken(
//             { id: isExistUser._id, role: isExistUser.role },
//             config.jwt.jwt_secret as Secret,
//             config.jwt.jwt_expire_in as string
//         );

//         //create token
//         const refreshToken = jwtHelper.createToken(
//             { id: isExistUser._id, role: isExistUser.role },
//             config.jwt.jwtRefreshSecret as Secret,
//             config.jwt.jwtRefreshExpiresIn as string
//         );

//         return { accessToken, refreshToken };

//     } else {

//         const user = await User.create({ appId, role, verified: true });
//         if (!user) {
//             throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to created User")
//         }

//         //create token
//         const accessToken = jwtHelper.createToken(
//             { id: user._id, role: user.role },
//             config.jwt.jwt_secret as Secret,
//             config.jwt.jwt_expire_in as string
//         );

//         //create token
//         const refreshToken = jwtHelper.createToken(
//             { id: user._id, role: user.role },
//             config.jwt.jwtRefreshSecret as Secret,
//             config.jwt.jwtRefreshExpiresIn as string
//         );

//         return { accessToken, refreshToken };
//     }
// }

// delete user
// delete user




const deleteUserFromDB = async (user: JwtPayload, password: string): Promise<void> => {
  // 1️⃣ Find user
  const isExistUser = await User.findById(user.id).select('+password');
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // 2️⃣ Password required check
  if (!password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password is required to delete account");
  }

  // 3️⃣ Ensure user password exists
  if (!isExistUser.password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User has no password set");
  }

  // 4️⃣ Password match check
  const isMatch = await User.isMatchPassword(password, isExistUser.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
  }

  // 5️⃣ Delete user
  await User.findByIdAndDelete(user.id);
};


const deleteOwnUserAccount = async (userId: string, password: string) => {
  if (!userId || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User ID and password are required");
  }

  const user = await User.findById(userId).select("+password");
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  if (!user.password) throw new ApiError(StatusCodes.BAD_REQUEST, "This account has no password set");

  // Trim password to avoid whitespace issues
  const isMatch = await bcrypt.compare(password.trim(), user.password);
  if (!isMatch) throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect password");

  await User.findByIdAndDelete(userId);
  return { deletedUserId: userId };
};
// sendPhoneOtpToDB.ts
// sendPhoneOtpToDB.ts
const resendOtpToDB = async (identifier: string) => {
  const isEmail = identifier.includes("@");

  // 1️⃣ Find user
  const user = isEmail
    ? await User.findOne({ email: identifier }).select("+authentication")
    : await User.findOne({ phone: identifier }).select("+authentication");

  if (!user) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `User doesn't exist with this ${isEmail ? "email" : "phone"}`
    );
  }

  // 2️⃣ Generate OTP
  const otp = generateOTP();

  // 3️⃣ Ensure authentication object
  user.authentication = user.authentication || {};
  user.authentication.isResetPassword = true;

  // 4️⃣ Save OTP
  if (isEmail) {
    user.authentication.emailOTP = {
      code: otp,
      expireAt: new Date(Date.now() + 3 * 60 * 1000),
    };
    user.authentication.resetVia = "email";
  } else {
    user.authentication.phoneOTP = {
      code: otp,
      expireAt: new Date(Date.now() + 3 * 60 * 1000),
    };
    user.authentication.resetVia = "phone";
  }

  await user.save();

  // 5️⃣ Send OTP
  if (isEmail) {
    const values = {
      name: user.firstName ?? "",
      lastName: user.lastName ?? "",
      otp,
      email: user.email ?? "",
    };

    const template = emailTemplate.resetPassword(values);
    await emailHelper.sendEmail(template);
  } else {
    await sendOtp(user.phone!, otp.toString());
  }

  return {
    identifier,
    via: user.authentication.resetVia,
  };
};




const uploadDocumentImagesToDB = async (userId: string, files: Express.Multer.File[]) => {
  if (!files || files.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No files uploaded");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 1️⃣ Save file paths
  const imagePaths = files.map(file => `/image/${file.filename}`);
  user.documentVerified = (user.documentVerified || []).concat(imagePaths);

  let accessToken: string | undefined;

  // 2️⃣ Check phone & email verified
  // if (user.phoneVerified && user.emailVerified) {
  //   user.verified = true;

  //   // 3️⃣ Generate JWT token exactly like verifyEmailToDB
  //   const payload = {
  //     id: user._id,
  //     email: user.email,
  //     role: user.role,
  //     status: user.status
  //   };

  //   accessToken = jwtHelper.createToken(
  //     payload,
  //     config.jwt.jwt_secret as Secret,
  //     config.jwt.jwt_expire_in as string
  //   );
  // }

  await user.save();

  // 4️⃣ Return response
  if (accessToken) {
    return { documentVerified: user.documentVerified, accessToken };
  }

  return { documentVerified: user.documentVerified };
};

const archiveUserInDB = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  user.status = USER_STATUS.ARCHIVE; // status update
  await user.save();

  return user;
};


const googleClient = new OAuth2Client(config.social.google_client_id);

export const googleLoginToDB = async (idToken: string, role: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.social.google_client_id,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or unverified Google account");
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;

  let isFirstLogin = false;
  let user = await User.findOne({ email });

  //  Prevent Google ID mismatch
  if (user?.googleId && user.googleId !== googleId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Google account mismatch");
  }

  //  First-time Google signup
  if (!user) {
    const [referenceId, customUserId] = await Promise.all([
      createUniqueReferralId(),
      generateCustomUserId(role === USER_ROLES.MERCENT ? USER_ROLES.MERCENT : USER_ROLES.USER),
    ]);

    user = await User.create({
      referenceId,
      customUserId,
      email,
      firstName: payload.name,
      profile: payload.picture ?? null,
      googleId,
      authProviders: ["google"],
      verified: true,
      role: role === USER_ROLES.MERCENT ? USER_ROLES.MERCENT : USER_ROLES.USER,
    });

    isFirstLogin = true;
  }

  //  Link Google to existing non-password user
  else if (!user.googleId) {
    if (user.authProviders.includes("local")) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Account exists. Login with password to link Google."
      );
    }

    user.googleId = googleId;
    user.authProviders.push("google");
    await user.save();
  }


  const accessToken = jwtHelper.createToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.jwt_secret!,
    config.jwt.jwt_expire_in!
  );

  return {
    accessToken,
    subscription: user.subscription,
    isFirstLogin,
  };
};
export const AuthService = {
  // verifyEmailToDB,
  loginUserFromDB,
  forgetPasswordToDB,
  resetPasswordToDB,
  changePasswordToDB,
  newAccessTokenToUser,
  // resendVerificationEmailToDB,
  // socialLoginFromDB,
  deleteUserFromDB,
  deleteOwnUserAccount,
  resendOtpToDB,
  verifyOtpToDB,
  uploadDocumentImagesToDB,
  archiveUserInDB,
  googleLoginToDB
};