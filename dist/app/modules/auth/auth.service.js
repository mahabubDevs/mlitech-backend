"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.googleLoginToDB = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const cryptoToken_1 = __importDefault(require("../../../util/cryptoToken"));
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const resetToken_model_1 = require("../resetToken/resetToken.model");
const user_model_1 = require("../user/user.model");
const veevoTechOtp_1 = require("../../../config/veevoTechOtp");
const user_1 = require("../../../enums/user");
const google_auth_library_1 = require("google-auth-library");
const generateRefferalId_1 = require("../../../util/generateRefferalId");
const user_utils_1 = require("../user/user.utils");
const notificationsHelper_1 = require("../../../helpers/notificationsHelper");
const notification_model_1 = require("../notification/notification.model");
const DEVICE_ROLE_MAP = {
    merchant: [
        user_1.USER_ROLES.MERCENT,
        user_1.USER_ROLES.VIEW_MERCENT,
        user_1.USER_ROLES.ADMIN_MERCENT,
    ],
    admin: [
        user_1.USER_ROLES.ADMIN,
        user_1.USER_ROLES.SUPER_ADMIN,
        user_1.USER_ROLES.ADMIN_REP,
        user_1.USER_ROLES.ADMIN_SELL,
        user_1.USER_ROLES.VIEW_ADMIN,
    ],
    user: [
        user_1.USER_ROLES.USER
    ],
};
const loginUserFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { identifier, password, device, fcmToken } = payload;
    // 1️⃣ Find user by email or phone
    const user = yield user_model_1.User.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
    }).select('+password');
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    if (!user.verified)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please verify your account before login');
    if (user.status !== user_1.USER_STATUS.ACTIVE)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Your account is not active. Please contact support.');
    if (password && !(yield user_model_1.User.isMatchPassword(password, user.password)))
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect!');
    // 2️⃣ Device-based role validation
    const allowedRoles = DEVICE_ROLE_MAP[device.toLowerCase()];
    if (!allowedRoles)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid device type");
    if (!allowedRoles.includes(user.role)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, `Your role '${user.role}' is not allowed to login from a ${device} device`);
    }
    // 3️⃣ Create tokens
    const accessToken = jwtHelper_1.jwtHelper.createToken({ id: user._id, role: user.role, email: user.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    const refreshToken = jwtHelper_1.jwtHelper.createToken({ id: user._id, role: user.role, email: user.email }, config_1.default.jwt.jwtRefreshSecret, config_1.default.jwt.jwtRefreshExpiresIn);
    yield user_model_1.User.findByIdAndUpdate(user._id, Object.assign({ latestToken: accessToken }, (fcmToken && { fcmToken })));
    return {
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
            role: user.role,
            pages: user.pages || [],
            subscription: user.subscription,
            businessName: user.businessName || "",
            isUserWaiting: user.isUserWaiting,
            location: (_a = user.location) !== null && _a !== void 0 ? _a : { type: 'Point', coordinates: [0, 0] },
        }
    };
});
// //login
// const  loginUserFromDB = async (payload: ILoginData) => {
//   const { identifier, password } = payload;
//   // 1️⃣ Find user by email or phone
//   const user: any = await User.findOne({
//     $or: [{ email: identifier }, { phone: identifier }],
//   }).select('+password');
//   if (!user) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
//   }
//   // 2️⃣ Check verified
//   if (!user.verified) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Please verify your account before login');
//   }
//   // Check user active or not
//   if (user.status !== USER_STATUS.ACTIVE) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Your account is not active. Please contact support.');
//   }
//   // 3️⃣ Check password match
//   if (password && !(await User.isMatchPassword(password, user.password))) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect!');
//   }
//   // if (user.role === USER_ROLES.USER && user.subscription !== SUBSCRIPTION_STATUS.ACTIVE) {
//   //   throw new ApiError(StatusCodes.BAD_REQUEST, "You are not subscribed");
//   // }
//   // 4️⃣ Status check
//   switch (user.status) {
//     case USER_STATUS.ACTIVE:
//       // create tokens
//       const accessToken = jwtHelper.createToken(
//         { id: user._id, role: user.role, email: user.email },
//         config.jwt.jwt_secret as Secret,
//         config.jwt.jwt_expire_in as string
//       );
//       const refreshToken = jwtHelper.createToken(
//         { id: user._id, role: user.role, email: user.email },
//         config.jwt.jwtRefreshSecret as Secret,
//         config.jwt.jwtRefreshExpiresIn as string
//       );
//       // ✅ Save latest token to DB
//     await User.findByIdAndUpdate(user._id, { latestToken: accessToken });
//       return {
//         success: true,
//         message: "Login successful",
//         accessToken,
//         refreshToken,
//         user: {
//           role: user.role,
//           pages: user.pages || [],
//           subscription: user.subscription,
//           businessName: user.businessName || "",
//           isUserWaiting: user.isUserWaiting,
//           location: user.location ?? {
//             type: 'Point',
//             coordinates: [0, 0],
//           },
//         }
//       };
//     case USER_STATUS.ARCHIVE:
//       throw new ApiError(StatusCodes.BAD_REQUEST, "Your account is archived. Please verify your account first");
//     case USER_STATUS.BLOCK:
//       throw new ApiError(StatusCodes.FORBIDDEN, "You are blocked. Contact admin.");
//     default:
//       throw new ApiError(StatusCodes.BAD_REQUEST, "Please verify your account for admin approval");
//   }
// };
//forget password
const forgetPasswordToDB = (identifier) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const isEmail = identifier.includes("@");
    // 1️⃣ Find user by email or phone
    const user = isEmail
        ? yield user_model_1.User.findOne({ email: identifier })
        : yield user_model_1.User.findOne({ phone: identifier });
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // 2️⃣ Generate OTP
    const otp = (0, generateOTP_1.default)();
    user.authentication = user.authentication || {};
    user.authentication.isResetPassword = true;
    if (isEmail) {
        // 📧 Email OTP
        user.authentication.emailOTP = {
            code: otp,
            expireAt: new Date(Date.now() + 3 * 60000),
        };
        user.authentication.resetVia = "email";
    }
    else {
        // 📱 Phone OTP
        user.authentication.phoneOTP = {
            code: otp,
            expireAt: new Date(Date.now() + 3 * 60000),
        };
        user.authentication.resetVia = "phone";
    }
    yield user.save();
    // 3️⃣ Send OTP
    if (isEmail) {
        const values = {
            name: (_a = user.firstName) !== null && _a !== void 0 ? _a : "",
            lastName: (_b = user.lastName) !== null && _b !== void 0 ? _b : "",
            otp: otp,
            email: (_c = user.email) !== null && _c !== void 0 ? _c : ""
        };
        const resetPasswordTemplate = emailTemplate_1.emailTemplate.resetPassword(values);
        yield emailHelper_1.emailHelper.sendEmail(resetPasswordTemplate);
    }
    else {
        // Phone OTP (existing system)
        yield (0, veevoTechOtp_1.sendOtp)(user.phone, otp.toString());
    }
    return {
        identifier,
        via: user.authentication.resetVia,
    };
});
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
const verifyOtpToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { identifier, oneTimeCode } = payload;
    const isEmail = identifier.includes("@");
    // 1️⃣ Find user by email or phone
    const user = isEmail
        ? yield user_model_1.User.findOne({ email: identifier }).select("+authentication")
        : yield user_model_1.User.findOne({ phone: identifier }).select("+authentication");
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    // 2️⃣ Validate OTP
    if (!oneTimeCode) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please provide OTP sent to your identifier");
    }
    const otpInfo = isEmail ? (_a = user.authentication) === null || _a === void 0 ? void 0 : _a.emailOTP : (_b = user.authentication) === null || _b === void 0 ? void 0 : _b.phoneOTP;
    if (!otpInfo || otpInfo.code !== oneTimeCode) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You provided wrong OTP");
    }
    if (!otpInfo.expireAt || otpInfo.expireAt < new Date()) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "OTP already expired, request new one");
    }
    // 3️⃣ Mark verified & clear OTP
    if (!user.verified)
        user.verified = true;
    if (user.authentication) {
        if (isEmail)
            delete user.authentication.emailOTP;
        else
            delete user.authentication.phoneOTP;
        user.authentication.isResetPassword = true; // allow reset flow
    }
    else {
        user.authentication = { isResetPassword: true };
    }
    yield user.save();
    // 4️⃣ Generate JWT access token
    const accessToken = jwtHelper_1.jwtHelper.createToken({ id: user._id, role: user.role, email: user.email, phoneNumber: user.phone }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    user.latestToken = accessToken;
    yield user.save();
    // 5️⃣ Generate reset token (for password reset)
    const resetToken = (0, cryptoToken_1.default)();
    yield resetToken_model_1.ResetToken.create({
        user: user._id,
        token: resetToken,
        expireAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });
    // ✅ 6️⃣ Background referral check (fire-and-forget)
    // ✅ Background referral check (fire-and-forget)
    ((verifiedUser) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (verifiedUser.referredInfo) {
                const referredId = verifiedUser.referredInfo.referredId;
                console.log(`[Background] User ${verifiedUser.email} has a referral. ReferredId: ${referredId}`);
                // Find referring user by customUserId
                const referringUser = yield user_model_1.User.findOne({ referenceId: referredId });
                if (referringUser) {
                    console.log(`[Background] Referring User Info -> Name: ${referringUser.firstName}, Email: ${referringUser.email}, Role: ${referringUser.role}`);
                    if (["ADMIN_REP", "ADMIN_SELL"].includes(referringUser.role)) {
                        // Send notification to referring user
                        yield (0, notificationsHelper_1.sendNotification)({
                            userIds: [referringUser._id],
                            title: "New customer added under you",
                            body: `Congratulations! A new member ${verifiedUser.firstName || verifiedUser.email} has been added under you.`,
                            type: notification_model_1.NotificationType.MANUAL,
                            metadata: { referralId: verifiedUser._id.toString() },
                            channel: { socket: true, push: true },
                        });
                        console.log(`[Background] Notification sent to ${referringUser.email} (Role: ${referringUser.role})`);
                    }
                }
                else {
                    console.log(`[Background] Referring user not found for ReferredId: ${referredId}`);
                }
            }
            else {
                console.log(`[Background] User ${verifiedUser.email} has NO referral.`);
            }
        }
        catch (err) {
            console.error("[Background] Referral check error:", err);
        }
    }))(user);
    return { message: "OTP verified successfully", accessToken, resetToken };
});
//forget password
const resetPasswordToDB = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { newPassword, confirmPassword } = payload;
    console.log("[Step 0] Resetting password with token:", token);
    // 1️⃣ Check if token exists
    const isExistToken = yield resetToken_model_1.ResetToken.isExistToken(token);
    console.log("[Step 1] Token exists:", !!isExistToken);
    if (!isExistToken) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized');
    }
    // 2️⃣ Get user with authentication
    const isExistUser = yield user_model_1.User.findById(isExistToken.user)
        .select('+password +previousPasswords +authentication');
    console.log("[Step 2] Found user:", isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser._id);
    if (!((_a = isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser.authentication) === null || _a === void 0 ? void 0 : _a.isResetPassword)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You don't have permission to change the password. Please click again to 'Forgot Password'");
    }
    // 3️⃣ Check token validity
    const isValid = yield resetToken_model_1.ResetToken.isExpireToken(token);
    console.log("[Step 3] Token valid:", isValid);
    if (!isValid) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token expired, Please click again to the forget password');
    }
    // 4️⃣ Check new password matches confirm password
    console.log("[Step 4] New Password:", newPassword, "Confirm Password:", confirmPassword);
    if (newPassword !== confirmPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    // 5️⃣ Check previousPasswords array
    console.log("[Step 5] Checking previousPasswords for reuse...");
    if ((_b = isExistUser.previousPasswords) === null || _b === void 0 ? void 0 : _b.length) {
        for (const prev of isExistUser.previousPasswords) {
            const match = yield bcrypt_1.default.compare(newPassword, prev.hash);
            console.log("    Comparing with previous hash:", prev.hash, "Match:", match);
            if (match) {
                throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You cannot reuse an old password!');
            }
        }
    }
    // 6️⃣ Hash new password
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    console.log("[Step 6] Hashed new password:", hashPassword);
    // 7️⃣ Push old password to previousPasswords
    isExistUser.previousPasswords = isExistUser.previousPasswords || [];
    if (isExistUser.password) {
        isExistUser.previousPasswords.push({
            hash: isExistUser.password,
            changedAt: new Date()
        });
        console.log("[Step 7] Old password pushed to previousPasswords:", isExistUser.password);
    }
    // 6️⃣ Check current password to prevent reuse
    if (isExistUser.password) {
        const isSameAsCurrent = yield bcrypt_1.default.compare(newPassword, isExistUser.password);
        console.log("[Step 6] Compare with current password:", isSameAsCurrent);
        if (isSameAsCurrent) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please provide a different password from the previous one');
        }
    }
    // 8️⃣ Update user password and reset authentication
    const updateData = {
        password: hashPassword,
        authentication: {
            isResetPassword: false,
        },
        previousPasswords: isExistUser.previousPasswords
    };
    console.log("[Step 8] Updating user password with new hash");
    yield user_model_1.User.findOneAndUpdate({ _id: isExistToken.user }, updateData, { new: true });
    console.log("[Step 9] Password reset completed for user:", isExistUser._id);
});
const changePasswordToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Step 1: User payload", user);
    const { currentPassword, newPassword, confirmPassword } = payload;
    const isExistUser = yield user_model_1.User.findById(user._id).select('+password');
    console.log("Step 2: Found user", isExistUser);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //current password match
    if (currentPassword &&
        !(yield user_model_1.User.isMatchPassword(currentPassword, isExistUser.password))) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }
    //newPassword and current password
    if (currentPassword === newPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please give different password from current password');
    }
    //new password and confirm password check
    if (newPassword !== confirmPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
    }
    console.log("[Step 5] Checking previousPasswords for reuse...");
    if ((_a = isExistUser.previousPasswords) === null || _a === void 0 ? void 0 : _a.length) {
        for (const prev of isExistUser.previousPasswords) {
            const match = yield bcrypt_1.default.compare(newPassword, prev.hash);
            console.log("    Comparing with previous hash:", prev.hash, "Match:", match);
            if (match) {
                throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You cannot reuse an old password!');
            }
        }
    }
    //hash password
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    // 7️⃣ Push old password to previousPasswords
    isExistUser.previousPasswords = isExistUser.previousPasswords || [];
    if (isExistUser.password) {
        isExistUser.previousPasswords.push({
            hash: isExistUser.password,
            changedAt: new Date()
        });
        console.log("[Step 7] Old password pushed to previousPasswords:", isExistUser.password);
    }
    const updateData = {
        password: hashPassword,
        previousPasswords: isExistUser.previousPasswords,
    };
    yield user_model_1.User.findOneAndUpdate({ _id: user._id }, updateData, { new: true });
});
const newAccessTokenToUser = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if the token is provided
    if (!token) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token is required!');
    }
    const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwtRefreshSecret);
    const isExistUser = yield user_model_1.User.findById(verifyUser === null || verifyUser === void 0 ? void 0 : verifyUser.id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized access");
    }
    //create token
    const accessToken = jwtHelper_1.jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    return { accessToken };
});
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
const deleteUserFromDB = (user, password) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Find user
    const isExistUser = yield user_model_1.User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // 2️⃣ Password required check
    if (!password) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password is required to delete account");
    }
    // 3️⃣ Ensure user password exists
    if (!isExistUser.password) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User has no password set");
    }
    // 4️⃣ Password match check
    const isMatch = yield user_model_1.User.isMatchPassword(password, isExistUser.password);
    if (!isMatch) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }
    // 5️⃣ Delete user
    yield user_model_1.User.findByIdAndDelete(user.id);
});
const deleteOwnUserAccount = (userId, password) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId || !password) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID and password are required");
    }
    const user = yield user_model_1.User.findById(userId).select("+password");
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    if (!user.password)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "This account has no password set");
    // Trim password to avoid whitespace issues
    const isMatch = yield bcrypt_1.default.compare(password.trim(), user.password);
    if (!isMatch)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Incorrect password");
    // 🔹 Keep user info before delete
    const deletedUserInfo = {
        id: user._id,
        name: user.firstName || "Unknown User",
        email: user.email,
    };
    yield user_model_1.User.findByIdAndDelete(userId);
    // ✅ Background notification (fire & forget)
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const admins = yield user_model_1.User.find({
                role: { $in: ["ADMIN", "SUPER_ADMIN"] },
                status: "active",
            }).select("_id");
            const adminIds = admins.map((a) => a._id);
            if (adminIds.length) {
                yield (0, notificationsHelper_1.sendNotification)({
                    userIds: adminIds,
                    title: "User account deleted",
                    body: `User ${deletedUserInfo.name} (${deletedUserInfo.email}) has deleted their account.`,
                    type: notification_model_1.NotificationType.MANUAL,
                    metadata: {
                        deletedUserId: deletedUserInfo.id.toString(),
                        email: deletedUserInfo.email,
                    },
                    channel: { socket: true, push: true },
                });
            }
            console.log(`[Background] Account deletion notification sent to ${adminIds.length} admin(s)`);
        }
        catch (err) {
            console.error("[Background] Account delete notification error:", err);
        }
    }))();
    return { deletedUserId: userId };
});
// sendPhoneOtpToDB.ts
// sendPhoneOtpToDB.ts
const resendOtpToDB = (identifier) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const isEmail = identifier.includes("@");
    // 1️⃣ Find user
    const user = isEmail
        ? yield user_model_1.User.findOne({ email: identifier }).select("+authentication")
        : yield user_model_1.User.findOne({ phone: identifier }).select("+authentication");
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `User doesn't exist with this ${isEmail ? "email" : "phone"}`);
    }
    // 2️⃣ Generate OTP
    const otp = (0, generateOTP_1.default)();
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
    }
    else {
        user.authentication.phoneOTP = {
            code: otp,
            expireAt: new Date(Date.now() + 3 * 60 * 1000),
        };
        user.authentication.resetVia = "phone";
    }
    yield user.save();
    // 5️⃣ Send OTP
    if (isEmail) {
        const values = {
            name: (_a = user.firstName) !== null && _a !== void 0 ? _a : "",
            lastName: (_b = user.lastName) !== null && _b !== void 0 ? _b : "",
            otp,
            email: (_c = user.email) !== null && _c !== void 0 ? _c : "",
        };
        const template = emailTemplate_1.emailTemplate.resetPassword(values);
        yield emailHelper_1.emailHelper.sendEmail(template);
    }
    else {
        yield (0, veevoTechOtp_1.sendOtp)(user.phone, otp.toString());
    }
    return {
        identifier,
        via: user.authentication.resetVia,
    };
});
const uploadDocumentImagesToDB = (userId, files) => __awaiter(void 0, void 0, void 0, function* () {
    if (!files || files.length === 0) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No files uploaded");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // 1️⃣ Save file paths
    const imagePaths = files.map(file => `/image/${file.filename}`);
    user.documentVerified = (user.documentVerified || []).concat(imagePaths);
    let accessToken;
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
    yield user.save();
    // 4️⃣ Return response
    if (accessToken) {
        return { documentVerified: user.documentVerified, accessToken };
    }
    return { documentVerified: user.documentVerified };
});
const archiveUserInDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    user.status = user_1.USER_STATUS.ARCHIVE; // status update
    yield user.save();
    return user;
});
const googleClient = new google_auth_library_1.OAuth2Client(config_1.default.social.google_client_id);
const googleLoginToDB = (idToken, role) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const ticket = yield googleClient.verifyIdToken({
        idToken,
        audience: config_1.default.social.google_client_id,
    });
    const payload = ticket.getPayload();
    if (!(payload === null || payload === void 0 ? void 0 : payload.email) || !payload.email_verified) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid or unverified Google account");
    }
    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    let isFirstLogin = false;
    let user = yield user_model_1.User.findOne({ email });
    //  Prevent Google ID mismatch
    if ((user === null || user === void 0 ? void 0 : user.googleId) && user.googleId !== googleId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Google account mismatch");
    }
    //  First-time Google signup
    if (!user) {
        const [referenceId, customUserId] = yield Promise.all([
            (0, generateRefferalId_1.createUniqueReferralId)(),
            (0, user_utils_1.generateCustomUserId)(role === user_1.USER_ROLES.MERCENT ? user_1.USER_ROLES.MERCENT : user_1.USER_ROLES.USER),
        ]);
        user = yield user_model_1.User.create({
            referenceId,
            customUserId,
            email,
            firstName: payload.name,
            profile: (_a = payload.picture) !== null && _a !== void 0 ? _a : null,
            googleId,
            authProviders: ["google"],
            verified: true,
            role: role === user_1.USER_ROLES.MERCENT ? user_1.USER_ROLES.MERCENT : user_1.USER_ROLES.USER,
        });
        isFirstLogin = true;
    }
    //  Link Google to existing non-password user
    else if (!user.googleId) {
        if (user.authProviders.includes("local")) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.CONFLICT, "Account exists. Login with password to link Google.");
        }
        user.googleId = googleId;
        user.authProviders.push("google");
        yield user.save();
    }
    const accessToken = jwtHelper_1.jwtHelper.createToken({ id: user._id, role: user.role, email: user.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    return {
        accessToken,
        subscription: user.subscription,
        isFirstLogin,
    };
});
exports.googleLoginToDB = googleLoginToDB;
exports.AuthService = {
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
    googleLoginToDB: exports.googleLoginToDB
};
