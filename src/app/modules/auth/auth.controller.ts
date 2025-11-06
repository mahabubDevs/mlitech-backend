import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import ApiError from '../../../errors/ApiErrors';
import { jwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import { Secret } from 'jsonwebtoken';





const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { ...verifyData } = req.body;
    const result = await AuthService.verifyEmailToDB(verifyData);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});
const verifyPhone = catchAsync(async (req: Request, res: Response) => {
    const { ...verifyData } = req.body;

    console.log(req.user);
    // const tockens = req.headers.authorization;
    
    
    if (!req.user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }


    
    const userId = (req.user as any)._id;
    const result = await AuthService.verifyPhoneOtpToDB(verifyData, userId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result,
    });
});


const loginUser = catchAsync(async (req: Request, res: Response) => {
    const { ...loginData } = req.body;
    const result = await AuthService.loginUserFromDB(loginData);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'User login successfully',
        data: result
    });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
    const email = req.body.email;
    const result = await AuthService.forgetPasswordToDB(email);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Please check your email, we send a OTP!',
        data: result
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = req.headers.authorization;
    const { ...resetData } = req.body;
    const result = await AuthService.resetPasswordToDB(token!, resetData);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Password reset successfully',
        data: result
    });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new Error("User not authenticated");
    }
    
    console.log("Step 1: User data", user);
    const { ...passwordData } = req.body;
    await AuthService.changePasswordToDB(user, passwordData);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Password changed successfully',
    });
});


const newAccessToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.newAccessTokenToUser(refreshToken);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Generate Access Token successfully',
        data: result
    });
});

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



const deleteUser = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }
    const result = await AuthService.deleteUserFromDB(req.user, req.body.password);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Account Deleted successfully',
        data: result
    });
});

const sendPhoneOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone } = req.body;
    console.log("Received phone number:", phone);
    
    if (!req.user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    // Type assertion
    const userId = (req.user as any)._id;

    if (!phone) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Phone number is required");
    }

    // Call service
    const result = await AuthService.sendPhoneOtpToDB(phone, userId);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Phone OTP sent successfully',
        data: result
    });
});

const uploadDocumentImages = async (req: Request, res: Response) => {
  const userId = req.user && (req.user as any)._id;
  console.log("User ID from request:", userId);
    if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  // req.files type assertion
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (!files || !files['image']) {
    throw new ApiError(400, 'No images uploaded');
  }

  const uploadedPaths = await AuthService.uploadDocumentImagesToDB(userId, files['image']);

  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully',
    data: uploadedPaths,
  });
};


const archiveUser = catchAsync(async (req: Request, res: Response) => {
    // 1️⃣ Header থেকে Bearer token নাও
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Authorization token is required");
    }
    const token = authHeader.split(" ")[1];

    // 2️⃣ Token verify করে decoded payload নাও
    const decoded = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret);

    const userId = decoded?.id;
    if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token");
    }

    // 3️⃣ Service call করে user archive করাও
    const user = await AuthService.archiveUserInDB(userId);

    // 4️⃣ Response পাঠাও
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "User archived successfully",
        data: user,
    });
});



export const AuthController = {
    verifyEmail,
    loginUser,
    forgetPassword,
    resetPassword,
    changePassword,
    newAccessToken,
    // resendVerificationEmail,
    // socialLogin,
    deleteUser,
    sendPhoneOtp,
    verifyPhone,
    uploadDocumentImages,
    archiveUser
};