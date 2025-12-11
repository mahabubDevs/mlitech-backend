import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AnalyticsService } from "./analytics.service";

// User creates report
const getCustomerAnalytics = catchAsync(async (req: Request, res: Response) => {
  const merchantId = (req.user as any)._id;
  const { startDate, endDate, page = "1", limit = "10" } = req.query;

  const result = await AnalyticsService.getCustomerAnalytics(
    merchantId,
    startDate as string,
    endDate as string,
    Number(page),
    Number(limit)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Customer analytics fetched successfully",
    data: result.records,
    pagination: result.pagination,
  });
});

export const AnalyticsController = {
  getCustomerAnalytics,
};
