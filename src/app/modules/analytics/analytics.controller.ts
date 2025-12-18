import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AnalyticsService } from "./analytics.service";
import { get } from "mongoose";

// User creates report
const getBusinessCustomerAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const merchantId = (req.user as any)._id;
    const {
      startDate,
      endDate,
      page = "1",
      limit = "10",
      subscriptionStatus,
      customerName,
      location,
    } = req.query;

    const result = await AnalyticsService.getBusinessCustomerAnalytics(
      merchantId,
      startDate as string,
      endDate as string,
      Number(page),
      Number(limit),
      {
        subscriptionStatus: subscriptionStatus as string,
        customerName: customerName as string,
        location: location as string,
      }
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Customer analytics fetched successfully",
      data: result.data,
      pagination: result.pagination,
    });
  }
);

const getMerchantAnalytics = catchAsync(async (req: Request, res: Response) => {
  const {
    startDate,
    endDate,
    page = "1",
    limit = "10",
    subscriptionStatus,
    merchantName,
    location,
  } = req.query;

  const result = await AnalyticsService.getMerchantAnalytics(
    startDate as string,
    endDate as string,
    Number(page),
    Number(limit),
    {
      subscriptionStatus: subscriptionStatus as string,
      merchantName: merchantName as string,
      location: location as string,
    }
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Merchant analytics fetched successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

const getCustomerAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate, page = "1", limit = "10" } = req.query;

  const result = await AnalyticsService.getCustomerAnalytics(
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
  getBusinessCustomerAnalytics,
  getMerchantAnalytics,
  getCustomerAnalytics,
};
