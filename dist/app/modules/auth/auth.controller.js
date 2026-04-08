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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const auth_service_1 = require("./auth.service");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const config_1 = __importDefault(require("../../../config"));
// const verifyEmail = catchAsync(async (req: Request, res: Response) => {
//     const { ...verifyData } = req.body;
//     const result = await AuthService.verifyEmailToDB(verifyData);
//     sendResponse(res, {
//         success: true,
//         statusCode: StatusCodes.OK,
//         message: result.message,
//         data: result.data,
//     });
// });
const verifyOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthService.verifyOtpToDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.message,
        data: {
            accessToken: result.accessToken,
            resetToken: result.resetToken,
        },
    });
}));
const loginUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loginData = req.body;
    console.log("Login Data Received:", loginData);
    // ✅ Login and get accessToken + refreshToken
    const result = yield auth_service_1.AuthService.loginUserFromDB(loginData);
    // 🔹 Response same as before               
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User login successfully',
        data: result
    });
}));
const forgetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifier } = req.body; // phone or email
    const result = yield auth_service_1.AuthService.forgetPasswordToDB(identifier);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Please check your phone or email, we sent an OTP!',
        data: result
    });
}));
const resetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.authorization;
    const resetData = __rest(req.body, []);
    const result = yield auth_service_1.AuthService.resetPasswordToDB(token, resetData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Password reset successfully',
        data: result
    });
}));
const changePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        throw new Error("User not authenticated");
    }
    console.log("Step 1: User data", user);
    const passwordData = __rest(req.body, []);
    yield auth_service_1.AuthService.changePasswordToDB(user, passwordData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Password changed successfully',
    });
}));
const newAccessToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    const result = yield auth_service_1.AuthService.newAccessTokenToUser(refreshToken);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Generate Access Token successfully',
        data: result
    });
}));
// const resendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
//     const { email } = req.body;
//     const result = await AuthService.resendVerificationEmailToDB(email);
//     sendResponse(res, {
//         success: true,
//         statusCode: StatusCodes.OK,
//         message: 'Generate OTP and send successfully',
//         data: result
//     });
// });
// const socialLogin = catchAsync(async (req: Request, res: Response) => {
//     const result = await AuthService.socialLoginFromDB(req.body);
//     sendResponse(res, {
//         success: true,
//         statusCode: StatusCodes.OK,
//         message: 'Logged in Successfully',
//         data: result
//     });
// });
// delete user
const deleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new Error("User not authenticated");
    }
    const result = yield auth_service_1.AuthService.deleteUserFromDB(req.user, req.body.password);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Account Deleted successfully',
        data: result
    });
}));
const deleteOwnUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Step 1: Get logged-in user ID
    const userId = req.user && req.user._id;
    if (!userId)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID missing in request token");
    // Step 2: Get password from request
    const { password } = req.body;
    if (!password)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password is required to delete account");
    console.log("Logged-in userId from token:", userId);
    console.log("Password received for account deletion:", password);
    // Step 3: Call service
    const result = yield auth_service_1.AuthService.deleteOwnUserAccount(userId, password);
    // Step 4: Send response
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User account deleted successfully",
        data: result
    });
}));
const resendOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifier } = req.body; // email or phone
    if (!identifier) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email or phone is required");
    }
    const result = yield auth_service_1.AuthService.resendOtpToDB(identifier);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: `OTP resent successfully via ${result.via}`,
        data: result
    });
}));
const uploadDocumentImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user && req.user._id;
    console.log("User ID from request:", userId);
    if (!userId) {
        throw new ApiErrors_1.default(400, 'User ID is required');
    }
    // req.files type assertion
    const files = req.files;
    if (!files || !files['image']) {
        throw new ApiErrors_1.default(400, 'No images uploaded');
    }
    const uploadedPaths = yield auth_service_1.AuthService.uploadDocumentImagesToDB(userId, files['image']);
    res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        data: uploadedPaths,
    });
});
const archiveUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Header থেকে Bearer token নাও
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Authorization token is required");
    }
    const token = authHeader.split(" ")[1];
    // 2️⃣ Token verify করে decoded payload নাও
    const decoded = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
    const userId = decoded === null || decoded === void 0 ? void 0 : decoded.id;
    if (!userId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid token");
    }
    // 3️⃣ Service call করে user archive করাও
    const user = yield auth_service_1.AuthService.archiveUserInDB(userId);
    // 4️⃣ Response পাঠাও
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User archived successfully",
        data: user,
    });
}));
const googleLogin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idToken, role } = req.body;
    const result = yield auth_service_1.AuthService.googleLoginToDB(idToken, role);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User login successfully',
        data: result
    });
}));
exports.AuthController = {
    // verifyEmail,
    loginUser,
    forgetPassword,
    resetPassword,
    changePassword,
    newAccessToken,
    // resendVerificationEmail,
    // socialLogin,
    deleteUser,
    deleteOwnUser,
    resendOtp,
    verifyOtp,
    uploadDocumentImages,
    archiveUser,
    googleLogin
};
