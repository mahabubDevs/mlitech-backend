
import { Request, Response } from "express";
import { FavoriteService } from "./favorite.service";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import { IUser } from "../../user/user.interface";
import sendResponse from "../../../../shared/sendResponse";


const addFavorite = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  console.log("User in addFavorite:", user);
  const { merchantId } = req.body;

  const result = await FavoriteService.addFavorite(user._id?.toString() || "", merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant added to favorites",
    data: result,
  });
});

const getFavorites = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;

  const result = await FavoriteService.getUserFavorites(user._id?.toString() || "");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Favorite merchants fetched",
    data: result,
  });
});

const removeFavorite = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  const { merchantId } = req.params;

  const result = await FavoriteService.removeFavorite(
    user._id?.toString() || "",
    merchantId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant removed from favorites",
    data: result,
  });
});

export default {
  addFavorite,
  getFavorites,
  removeFavorite,
};
