import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { get, Types } from "mongoose";
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
  try {
    const user = req.user as any;

    // ✅ Decide which ID to use for filtering
    const filterId = user?.isSubMerchant ? user.merchantId : user._id;

    if (!filterId || !Types.ObjectId.isValid(filterId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    const merchantId = filterId;

    // Get range from query, default to "7d"
    const range = (req.query.range as string) || "7d";

    // Call service to get dashboard report
    const result = await DashboardMercentService.getReportForMerchantDashboard(
      merchantId,
      range
    );

    // Send response
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Merchant report fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error in getMerchantReport:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});



const getWeeklySellReport = catchAsync(async (req, res) => {
  try {
    const user = req.user as any;

    // ✅ Decide which ID to use for filtering (sub-merchant or main merchant)
    const filterId = user?.isSubMerchant ? user.merchantId : user._id;

    if (!filterId || !Types.ObjectId.isValid(filterId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized merchant",
      });
    }

    const merchantId = filterId;

    // Call service to get weekly sell report
    const result = await DashboardMercentService.getWeeklySellReport(merchantId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Weekly sell report fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error in getWeeklySellReport:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
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
  const user = req.user as any;

  // ✅ Decide which ID to use for filtering
  const filterId = user?.isSubMerchant ? user.merchantId : user._id;

  const year = Number(req.query.year) || undefined;

  const result = await DashboardMercentService.getCustomerChart(
    filterId,
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
