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
import { sendOtp } from '../../../shared/twilioService';
import { USER_STATUS } from '../../../enums/user';








//login
const loginUserFromDB = async (payload: ILoginData) => {
    const { email, password } = payload;

    // 1️⃣ User find করা
    const isExistUser: any = await User.findOne({ email }).select('+password');
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    // 2️⃣ Check verified
    if (!isExistUser.verified) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Please verify your account, then try to login again');
    }

    // 3️⃣ Check password match
    if (password && !(await User.isMatchPassword(password, isExistUser.password))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect!');
    }

    // 4️⃣ Status check
    switch (isExistUser.status) {
        case USER_STATUS.ACTIVE:
            // allowed → create token
            const accessToken = jwtHelper.createToken(
                { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
                config.jwt.jwt_secret as Secret,
                config.jwt.jwt_expire_in as string
            );

            const refreshToken = jwtHelper.createToken(
                { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
                config.jwt.jwtRefreshSecret as Secret,
                config.jwt.jwtRefreshExpiresIn as string
            );

            return { 
                success: true,
                message: "Login successful",
                accessToken,
                refreshToken,
                user: {
                    pages: isExistUser.pages || [],
                }
            };

        case USER_STATUS.ARCHIVE:
            throw new ApiError(StatusCodes.BAD_REQUEST, "Your account is archived. Please verify your account first");

        case USER_STATUS.BLOCK:
            throw new ApiError(StatusCodes.FORBIDDEN, "You are blocked. Contact admin.");

        default:
            throw new ApiError(StatusCodes.BAD_REQUEST, "Unknown user status");
    }
};


//forget password
const forgetPasswordToDB = async (email: string) => {
    const isExistUser = await User.isExistUserByEmail(email);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    // Generate OTP
    const otp = generateOTP();
    const value = {
        otp,
        email: isExistUser.email
    };

    // Send email
    const forgetPassword = emailTemplate.resetPassword(value);
    await emailHelper.sendEmail(forgetPassword);

    // Save OTP in DB under emailOTP
    await User.findOneAndUpdate(
        { email },
        { 
            $set: { 
                "authentication.emailOTP.code": otp,
                "authentication.emailOTP.expireAt": new Date(Date.now() + 3 * 60000),
                "authentication.isResetPassword": true
            } 
        }
    );
};

  
//verify email
const verifyEmailToDB = async (payload: IVerifyEmail) => {
  const { email, oneTimeCode } = payload;

  // 1️⃣ Find user with authentication
  const user = await User.findOne({ email }).select('+authentication');
  if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");

  // 2️⃣ Validate OTP
  if (!oneTimeCode || isNaN(Number(oneTimeCode))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please provide a valid OTP sent to your email');
  }

  const otpNumber = Number(oneTimeCode);

  if (user.authentication?.emailOTP?.code !== otpNumber) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You provided wrong OTP');
  }

  if (!user.authentication?.emailOTP?.expireAt || user.authentication.emailOTP.expireAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP already expired, please request a new one');

  }

    if (user.status !== USER_STATUS.ACTIVE) {
    user.status = USER_STATUS.ACTIVE;
  }

  let message: string;
  let data: any;



  // 3️⃣ First-time verification
  if (!user.emailVerified) {
    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      "authentication.emailOTP.code": null,
      "authentication.emailOTP.expireAt": null,
    });

    // ✅ Generate accessToken
    const accessToken = jwtHelper.createToken(
      { id: user._id, role: user.role, email: user.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );

    message = 'Email verified successfully';
    data = { accessToken };

  } else {
    // 4️⃣ Already verified → reset password flow
    await User.findByIdAndUpdate(user._id, {
      "authentication.emailOTP.code": null,
      "authentication.emailOTP.expireAt": null,
      "authentication.isResetPassword": true,
    });

    const accessToken = jwtHelper.createToken(
      { id: user._id, role: user.role, email: user.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );

    const resetToken = cryptoToken();
    await ResetToken.create({
      user: user._id,
      token: resetToken,
      expireAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });

    message = 'Verification Successful: Please securely store and utilize this code for reset password';
    data = { accessToken, resetToken };
  }

  return { message, data };
};

// verifyPhoneOtpToDB.ts
const verifyPhoneOtpToDB = async (payload: IVerifyPhone, userId: string) => {
  const { phone, oneTimeCode } = payload;

  // 1️⃣ Find user with authentication
  const user = await User.findById(userId).select('+authentication');
  if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  if (!user.phoneNumber || user.phoneNumber !== phone) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phone number mismatch!");
  }

  // 2️⃣ Validate OTP
  if (!oneTimeCode || isNaN(Number(oneTimeCode))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please provide a valid OTP sent to your phone');
  }

  const otpNumber = Number(oneTimeCode);
  if (user.authentication?.phoneOTP?.code !== otpNumber) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You provided wrong OTP');
  }
  if (!user.authentication?.phoneOTP?.expireAt || user.authentication.phoneOTP.expireAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP already expired, please request a new one');
  }

  // 3️⃣ Mark phone as verified
  let accessToken;
  if (!user.phoneVerified) {
    user.phoneVerified = true;
    user.authentication.phoneOTP.code = undefined;
    user.authentication.phoneOTP.expireAt = undefined;

    // If both email & phone verified, mark user as verified
    

    await user.save();

    // Generate access token
    accessToken = jwtHelper.createToken(
      { id: user._id, role: user.role, email: user.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );

    return { message: 'Phone verified successfully', accessToken };
  }

  return { message: 'Phone already verified' };
};




  
//forget password
const resetPasswordToDB = async ( token: string, payload: IAuthResetPassword ) => {

    const { newPassword, confirmPassword } = payload;

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
  
    const hashPassword = await bcrypt.hash( newPassword, Number(config.bcrypt_salt_rounds));
  
    const updateData = {
        password: hashPassword,
        authentication: {
            isResetPassword: false,
        }
    };
  
    await User.findOneAndUpdate(
        { _id: isExistToken.user }, 
        updateData,
        {new: true}
    );
};
  
const changePasswordToDB = async ( user: JwtPayload, payload: IChangePassword) => {

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
        throw new ApiError( StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
    }
  
    //hash password
    const hashPassword = await bcrypt.hash( newPassword, Number(config.bcrypt_salt_rounds));
  
    const updateData = {
        password: hashPassword,
    };

    await User.findOneAndUpdate({ _id: user._id }, updateData, { new: true });
};


const newAccessTokenToUser = async(token: string)=>{

    // Check if the token is provided
    if (!token) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required!');
    }
  
    const verifyUser = jwtHelper.verifyToken(
      token,
      config.jwt.jwtRefreshSecret as Secret
    );
  
    const isExistUser = await User.findById(verifyUser?.id);
    if(!isExistUser){
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



// sendPhoneOtpToDB.ts
const sendPhoneOtpToDB = async (phone: string, userId: string) => {
  // 1️⃣ Find user and include authentication
  const user = await User.findById(userId).select("+authentication");
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

  // 2️⃣ Check if phone already verified
  // if (user.phoneVerified) {
  //   throw new ApiError(StatusCodes.BAD_REQUEST, "Phone number already verified");
  // }

  // 3️⃣ Update phone if not already set
  if (!user.phoneNumber) {
    user.phoneNumber = phone;
  } else if (user.phoneNumber !== phone) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phone number mismatch!");
  }

  // 4️⃣ Generate OTP
  const otp = generateOTP();

  // 5️⃣ Ensure authentication object exists
  user.authentication = user.authentication || {};
  user.authentication.phoneOTP = {
    code: otp,
    expireAt: new Date(Date.now() + 3 * 60 * 1000), // OTP valid 3 minutes
  };

  // 6️⃣ Save user with OTP first
  await user.save();
  console.log("OTP saved to DB:", user.authentication.phoneOTP);

  // 7️⃣ Send OTP via Twilio (handle failure)
  try {
    await sendOtp(phone, `Your verification code is: ${otp}`);
    console.log(`OTP sent to ${phone} via Twilio: ${otp}`);
  } catch (error) {
    console.error("Twilio send error:", error);
    // OTP DB তে save আছে, তাই user retry করতে পারবে
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send OTP, try again");
  }

  return { phone };
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
  if (user.phoneVerified && user.emailVerified) {
    user.verified = true;

    // 3️⃣ Generate JWT token exactly like verifyEmailToDB
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status
    };

    accessToken = jwtHelper.createToken(
      payload,
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );
  }

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
 

export const AuthService = {
    verifyEmailToDB,
    loginUserFromDB,
    forgetPasswordToDB,
    resetPasswordToDB,
    changePasswordToDB,
    newAccessTokenToUser,
    // resendVerificationEmailToDB,
    // socialLoginFromDB,
    deleteUserFromDB,
    sendPhoneOtpToDB,
    verifyPhoneOtpToDB,
    uploadDocumentImagesToDB,
    archiveUserInDB
};