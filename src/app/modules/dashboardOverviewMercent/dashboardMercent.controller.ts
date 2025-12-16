import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { get } from "mongoose";
import { DashboardMercentService } from "./dashboardMercent.service";

// Dashboard Stats

const getTotalRevenue = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardMercentService.getTotalRevenue(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Total revenue fetched successfully",
    data: result,
  });
});
const getStatisticsForAdminDashboard = catchAsync(
  async (req: Request, res: Response) => {
    const range = (req.query.range as string) || "7d";
    const result = await DashboardMercentService.getStatisticsForAdminDashboard(
      range
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Statistics fetched successfully",
      data: result,
    });
  }
);
const getYearlyRevenue = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardMercentService.getYearlyRevenue(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Statistics fetched successfully",
    data: result,
  });
});

const getMerchantReport = catchAsync(async (req, res) => {
  const merchantId = (req.user as any)?._id;
  const range = (req.query.range as string) || "7d"; // today, 7d, 1m, 3m

  const result = await DashboardMercentService.getReportForMerchantDashboard(
    merchantId,
    range
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Merchant report fetched successfully",
    data: result,
  });
});

const getWeeklySellReport = catchAsync(async (req, res) => {
  const merchantId = (req.user as any)?._id;

  const result = await DashboardMercentService.getWeeklySellReport(merchantId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weekly sell report fetched successfully",
    data: result,
  });
});

const getTodayNewMembers = catchAsync(async (req, res) => {
  const merchantId = (req.user as any)?._id;

  const result = await DashboardMercentService.getTodayNewMembers(merchantId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Today's new members fetched successfully",
    data: result,
  });
});
const getCustomerChart = catchAsync(async (req, res) => {
  const merchantId = (req.user as any)._id;
  const year = Number(req.query.year) || undefined;

  const result = await DashboardMercentService.getCustomerChart(
    merchantId,
    year
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Customer chart fetched successfully",
    data: result,
  });
});
const getCustomerChartWeek = catchAsync(async (req, res) => {
  const merchantId = (req.user as any)._id;

  const { startDate, endDate } = req.query;

  const result = await DashboardMercentService.getCustomerChartWeek(
    merchantId,
    startDate as string,
    endDate as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Customer chart data fetched successfully",
    data: result,
  });
});

export const DashboardMercentController = {
  getTotalRevenue,
  getStatisticsForAdminDashboard,
  getYearlyRevenue,
  getMerchantReport,
  getWeeklySellReport,
  getTodayNewMembers,
  getCustomerChartWeek,
  getCustomerChart,
};
