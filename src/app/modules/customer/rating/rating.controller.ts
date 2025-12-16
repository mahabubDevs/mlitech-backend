
import { Request, Response } from "express";
import { RatingService } from "./rating.service";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import { IUser } from "../../user/user.interface";
import sendResponse from "../../../../shared/sendResponse";
;

const addRating = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  const { digitalCardId, promotionId, merchantId, rating, comment } = req.body;

  const userId = user._id?.toString();
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "User ID not found",
    });
  }

  const result = await RatingService.createRating(
    userId,
    digitalCardId,
    promotionId,
    merchantId,
    rating,
    comment
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Rating submitted successfully",
    data: result,
  });
});

const getMerchantRatings = catchAsync(async (req: Request, res: Response) => {
  const { merchantId } = req.params;

  const result = await RatingService.getMerchantRatings(merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ratings fetched successfully",
    data: result,
  });
});

export const RatingController = {
  addRating,
  getMerchantRatings,
};
