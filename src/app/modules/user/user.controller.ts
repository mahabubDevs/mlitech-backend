import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserService } from "./user.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { JwtPayload } from "jsonwebtoken";
import { Subscription } from "../subscription/subscription.model";
import { DigitalCard } from "../customer/digitalCard/digitalCard.model";

// register user
const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = {
      ...req.body,
      //   gender: req.body.gender || "Unknown",
    };

    const result = await UserService.createUserToDB(userData);
    console.log("Created User:", result);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Enter the verification code sent to your phone. please verify your phone ${result.phone}`,
    });
  }
);

// register admin
const createAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createAdminToDB(userData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Admin created successfully",
      data: result,
    });
  }
);

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
    message: "Profile data retrieved successfully",
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    let bodyData = req.body;
    // 🔹 যদি body JSON string হয়ে আসে, তাহলে parse করো
    if (typeof req.body.data === "string") {
      bodyData = JSON.parse(req.body.data);
    }

      if (bodyData.phone) {
      return sendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Phone number cannot be changed",
      });
    }

   

    let profile;
    if (req.files && "profile" in req.files && req.files.profile[0]) {
      profile = `/images/${req.files.profile[0].filename}`;
    }
    let photo;
    if (req.files && "coverPhoto" in req.files && req.files.coverPhoto[0]) {
      photo = `/images/${req.files.coverPhoto[0].filename}`;
    }

    if (bodyData?.latitude && bodyData?.longitude) {
      bodyData.location = {
        type: "Point",
        coordinates: [Number(bodyData.longitude), Number(bodyData.latitude)],
      };
      delete bodyData.latitude;
      delete bodyData.longitude;
    }


      /** 🔔 Notification settings safe update */
  const notificationUpdate: Record<string, boolean> = {};

    if (bodyData.notificationSettings) {
      // Loop through notificationSettings
      for (const [key, value] of Object.entries(bodyData.notificationSettings)) {
        // value যদি string "true"/"false" হয়, তাহলে boolean-এ convert করো
        if (typeof value === "string") {
          notificationUpdate[`notificationSettings.${key}`] = value.toLowerCase() === "true";
        } else {
          // যদি boolean হয়ে আসে, 그대로 assign করো
          notificationUpdate[`notificationSettings.${key}`] = value as boolean;
        }
      }

  // মূল bodyData থেকে notificationSettings remove করো
  delete bodyData.notificationSettings;
}

    const data = {
      profile,
      photo,

      ...bodyData,
      ...notificationUpdate,
    };

    // console.log("data", data);
    const result = await UserService.updateProfileToDB(
      user as JwtPayload,
      data
    );




    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Profile updated successfully",
      data: result,
    });
  }
);

const getUserOnlineStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  const result = await UserService.getUserOnlineStatusFromDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User online status fetched successfully",
    data: result,
  });
});

const getUserSummaryCounts = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;
  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "User not logged in",
    });
  }

  // 1️⃣ Fetch subscriptions with package title
  const subscriptions = await Subscription.find({ user: userId })
    .populate("package", "title") // fetch only package title
    .lean();

  // Extract only titles
  const subscriptionTitles = subscriptions.map(sub => (sub.package as any)?.title).filter(Boolean);

  // 2️⃣ Total spent
  const totalSpent = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

  // 3️⃣ Total digital cards
  const totalDigitalCards = await DigitalCard.countDocuments({ userId });

  // 4️⃣ Total promotions
  const digitalCards = await DigitalCard.find({ userId }).select("promotions").lean();
  const totalPromotions =  digitalCards.reduce((sum, card) => {
    const available = (card.promotions || []).filter(
      (p: any) => p.status !== "used"
    ).length;
    return sum + available;
  }, 0);

  
  // 5️⃣ Minimal response
  res.status(StatusCodes.OK).json({
    success: true,
    message: "User Summary fetched successfully",
    data: {
      totalSpent,
      totalDigitalCards,
      totalPromotions,
      subscriptionTitles,
    },
  });
});


export const UserController = {
  createUser,
  createAdmin,
  getUserProfile,
  updateProfile,
  getUserOnlineStatus,
  getUserSummaryCounts

};
