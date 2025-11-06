import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from './user.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiErrors';
import { JwtPayload } from 'jsonwebtoken';

// register user
const createUser = catchAsync( async (req: Request, res: Response, next: NextFunction) => {
    const userData = {
  ...req.body,
  gender: req.body.gender || "Unknown",
};

    const result = await UserService.createUserToDB(userData);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: `Enter the verification code sent to your email. please verify your email ${result.email}  `,
    })
});

// register admin
const createAdmin = catchAsync( async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createAdminToDB(userData);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Admin created successfully',
        data: result
    });
});

// retrieved user profile
const getUserProfile = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not logged in");
    }

    const result = await UserService.getUserProfileFromDB(user);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Profile data retrieved successfully',
        data: result
    });
});


//update profile
const updateProfile = catchAsync( async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

     let bodyData = req.body;
  // 🔹 যদি body JSON string হয়ে আসে, তাহলে parse করো
  if (typeof req.body.data === "string") {
    bodyData = JSON.parse(req.body.data);
  }
    
    let profile;
    if (req.files && 'image' in req.files && req.files.image[0]) {
        profile = `/images/${req.files.image[0].filename}`;
    }

    const data = {
        profile,
        ...bodyData,
    };

    // console.log("data", data);
    const result = await UserService.updateProfileToDB(user as JwtPayload, data);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Profile updated successfully',
        data: result
    });
});


const getUserOnlineStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  const result = await UserService.getUserOnlineStatusFromDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User online status fetched successfully',
    data: result,
  });
});


export const UserController = { 
    createUser, 
    createAdmin, 
    getUserProfile, 
    updateProfile,
    getUserOnlineStatus
};