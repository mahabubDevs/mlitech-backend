import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { DashboardService } from "./dashboard.service";

// Dashboard Stats


// Age Distribution
const getAgeDistribution = catchAsync(async (req: Request, res: Response) => {
  const ageData = await DashboardService.getAgeDistribution();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Age distribution fetched successfully",
    data: ageData,
  });
});


const getEthnicityDistribution = catchAsync(async (req: Request, res: Response) => {
  const data = await DashboardService.getEthnicityDistribution();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ethnicity distribution fetched successfully",
    data,
  });
});


// Gender distribution
const getGenderDistribution = catchAsync(async (req: Request, res: Response) => {
  const data = await DashboardService.getGenderDistribution();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Gender distribution fetched successfully",
    data,
  });
});

// Monthly signups
const getMonthlySignups = catchAsync(async (req: Request, res: Response) => {
  const data = await DashboardService.getMonthlySignups();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Monthly user signups fetched successfully",
    data,
  });
});

export const DashboardController = {

  getAgeDistribution,
  getEthnicityDistribution,
  getGenderDistribution,
  getMonthlySignups
};
