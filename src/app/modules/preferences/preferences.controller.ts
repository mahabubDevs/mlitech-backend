// src/app/modules/userPreference/userPreference.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserPreferenceService } from "./preferences.service";

const createPreference = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const result = await UserPreferenceService.createPreference(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Preference created successfully",
    data: result,
  });
});

const getPreference = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const result = await UserPreferenceService.getPreference(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Preference fetched successfully",
    data: result,
  });
});

const updatePreference = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const result = await UserPreferenceService.updatePreference(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Preference updated successfully",
    data: result,
  });
});

const deletePreference = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const result = await UserPreferenceService.deletePreference(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Preference deleted successfully",
    data: result,
  });
});

export const UserPreferenceController = {
  createPreference,
  getPreference,
  updatePreference,
  deletePreference,
};
