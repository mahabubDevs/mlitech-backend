import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AnalyticsService } from "./analytics.service";
import { get } from "mongoose";
import { generateExcelBuffer } from "../../../helpers/excelExport";

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


const exportBusinessCustomerAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const merchantId = (req.user as any)._id;

    const {
      startDate,
      endDate,
      subscriptionStatus,
      customerName,
      location,
    } = req.query;

    const buffer =
      await AnalyticsService.exportBusinessCustomerAnalytics(
        merchantId,
        startDate as string,
        endDate as string,
        {
          subscriptionStatus: subscriptionStatus as string,
          customerName: customerName as string,
          location: location as string,
        }
      );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=business-customer-analytics.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
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
  const {
    startDate,
    endDate,
    page = "1",
    limit = "10",
    subscriptionStatus,
    customerName,
    location,
  } = req.query;

  const result = await AnalyticsService.getCustomerAnalytics(
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
});


const exportCustomerAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const { startDate, endDate, subscriptionStatus, customerName, location } =
      req.query;

    const buffer = await AnalyticsService.exportCustomerAnalytics(
      startDate as string,
      endDate as string,
      {
        subscriptionStatus: subscriptionStatus as string,
        customerName: customerName as string,
        location: location as string,
      }
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=customer-analytics-full.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.status(200).send(buffer);
  }
);



// controller
// controller.ts
const exportMerchantAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const { startDate, endDate, subscriptionStatus, merchantName, location } =
      req.query;

    console.log("🚀 Export request received with filters:", {
      startDate,
      endDate,
      subscriptionStatus,
      merchantName,
      location,
    });

    // Export all filtered data
    const result = await AnalyticsService.getMerchantAnalyticsExport(
      startDate as string,
      endDate as string,
      1, // page ignored
      0, // 0 = export all
      {
        subscriptionStatus: subscriptionStatus as string,
        merchantName: merchantName as string,
        location: location as string,
      }
    );

    console.log("🔹 Aggregated records count:", result.records.length);

    const records = result.records;

    // Show first 5 records for debug
    console.log("🔸 Sample records:", records.slice(0, 5));

    const columns = [
      { header: "Merchant Name", key: "merchantName" },
      { header: "Location", key: "location" },
      { header: "Subscription Status", key: "subscriptionStatus" },
      { header: "Total Revenue", key: "totalRevenue" },
      { header: "Points Redeemed", key: "pointsRedeemed" },
      { header: "Users Count", key: "usersCount" },
      { header: "Joining Date", key: "joiningDate" },
    ];

    const buffer = await generateExcelBuffer({
      sheetName: "Merchant Analytics",
      columns,
      rows: records,
    });

    console.log("✅ Excel buffer generated, size:", buffer.length, "bytes");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=merchant-analytics.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  }
);






const exportMerchantMonthlyAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    console.log("🚀 Monthly export request:", { startDate, endDate });

    // ---------------- Fetch monthlyData ----------------
    const result = await AnalyticsService.getMerchantAnalyticsMonthly(
      startDate as string,
      endDate as string,
      1, // page ignored
      0, // limit 0 = fetch all
      {} // no filters needed, full monthly data
    );

    const monthlyData = result.data.monthlyData;

    console.log("🔹 Monthly records count:", monthlyData.length);
    console.log("🔸 Sample records:", monthlyData.slice(0, 5));

    // ---------------- Excel Columns ----------------
    const columns = [
      { header: "Year", key: "year" },
      { header: "Month", key: "monthName" },
      { header: "Total Revenue", key: "totalRevenue" },
      { header: "Points Redeemed", key: "pointsRedeemed" },
      { header: "Users Count", key: "usersCount" },
    ];

    // ---------------- Generate Excel ----------------
    const buffer = await generateExcelBuffer({
      sheetName: "Monthly Analytics",
      columns,
      rows: monthlyData,
    });

    console.log("✅ Excel buffer generated, size:", buffer.length, "bytes");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=merchant-monthly-analytics.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  }
);




const exportCustomerMonthlyData = catchAsync(
  async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    console.log("🚀 Customer Monthly export request:", { startDate, endDate });

    // ---------------- Fetch monthlyData ----------------
    const result = await AnalyticsService.getCustomerAnalytics(
      startDate as string,
      endDate as string,
      1, // page ignored
      0, // limit 0 = all data
      {}
    );

    const monthlyData = result.data.monthlyData;

    console.log("🔹 Monthly records count:", monthlyData.length);
    console.log("🔸 Sample records:", monthlyData.slice(0, 5));

    // ---------------- Excel Columns ----------------
    const columns = [
      { header: "Year", key: "year" },
      { header: "Month", key: "monthName" },
      { header: "Points Accumulated", key: "pointsAccumulated" },
      { header: "Points Redeemed", key: "pointsRedeemed" },
    ];

    // ---------------- Generate Excel ----------------
    const buffer = await generateExcelBuffer({
      sheetName: "Customer Monthly Data",
      columns,
      rows: monthlyData,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=customer-monthly-data.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  }
);


const getPointRedeemedAnalytics = catchAsync(async (req: Request, res: Response) => {

  const result = await AnalyticsService.getPointRedeemedAnalytics(req.query.startDate as string, req.query.endDate as string)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Point redeemed analytics fetched successfully",
    data: result
  })
})
const getRevenuePerUser = catchAsync(async (req: Request, res: Response) => {

  const result = await AnalyticsService.getRevenuePerUser(req.query.startDate as string, req.query.endDate as string)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Revenue per user analytics fetched successfully",
    data: result
  })
})

export const AnalyticsController = {
  getBusinessCustomerAnalytics,
  getMerchantAnalytics,
  getCustomerAnalytics,
  exportMerchantAnalytics,

  exportCustomerAnalytics,
  exportBusinessCustomerAnalytics,
  exportMerchantMonthlyAnalytics,
  exportCustomerMonthlyData,
  getPointRedeemedAnalytics,
  getRevenuePerUser

};
