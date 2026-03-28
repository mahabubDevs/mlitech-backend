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
    const user = req.user as any;

    const merchantId = user._id;
    const role = user.role;
    const isSubMerchant = user.isSubMerchant;
    const mainMerchantId = user.merchantId?.toString();

    const {
      startDate,
      endDate,
      page = "1",
      limit = "10",
      subscriptionStatus,
      customerName,
      location,
      city,
      paymentStatus
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
        city: city as string,
        paymentStatus: paymentStatus as string,
      },
      role,
      isSubMerchant,
      mainMerchantId
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




// const getMerchantAnalytics = catchAsync(async (req: Request, res: Response) => {
//   const {
//     startDate,
//     endDate,
//     page = "1",
//     limit = "10",
//     subscriptionStatus,
//     merchantName,
//     location,
//     paymentStatus,
//     city,
//     customerName,
//   } = req.query;

//   console.log("Query received:", req.query); // <-- log incoming query

//   const userRole = (req.user as any)?.role;
//   console.log("User role:", userRole);

//   const result = await AnalyticsService.getMerchantAnalytics(
//     startDate as string,
//     endDate as string,
//     Number(page),
//     Number(limit),
//     {
//       subscriptionStatus: subscriptionStatus as string,
//       merchantName: merchantName as string,
//       location: location as string,
//       paymentStatus: paymentStatus as string,
//       city: city as string,
//       customerName: customerName as string,
//     },
//     userRole
//   );

//   console.log("Analytics result:", result); // <-- log full result

//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Merchant analytics fetched successfully",
//     data: result.data,
//     pagination: result.pagination,
//   });
// });




const getMerchantAnalytics = catchAsync(async (req: Request, res: Response) => {
  const {
    startDate,
    endDate,
    page = "1",
    limit = "10",
    subscriptionStatus,
    customerName,
    location,
    paymentStatus,
    city
  } = req.query;

  console.log("Controller - Received query:", {
    startDate,
    endDate,
    subscriptionStatus,
    customerName,
    location,
    paymentStatus,
    city
  });

  const userRole = (req.user as any)?.role;
  const merchantId = (req.user as any)?._id;

  console.log("Controller - User role:", userRole, "Merchant ID:", merchantId);

  const result = await AnalyticsService.getMerchantAnalytics(
    startDate as string,
    endDate as string,
    Number(page),
    Number(limit),
    {
      subscriptionStatus: subscriptionStatus as string,
      customerName: customerName as string,
      location: location as string,
      paymentStatus: paymentStatus as string,
      city: city as string
    },
    userRole,
    // merchantId
  );

  console.log(
    "Controller - Records Fetched:", result.data.records.length,
    "Total Records Count:", result.pagination.total
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Merchant customer analytics fetched successfully",
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
    paymentStatus,
    city
  } = req.query;

  console.log("Controller - Received query:", {
    startDate,
    endDate,
    subscriptionStatus,
    customerName,
    location,
    paymentStatus,
    city
   });

  // Get logged-in user role
  const userRole = (req.user as any)?.role;
  console.log("Controller - User Role:", userRole);

  const result = await AnalyticsService.getCustomerAnalytics(
    startDate as string,
    endDate as string,
    Number(page),
    Number(limit),
    {
      subscriptionStatus: subscriptionStatus as string,
      customerName: customerName as string,
      location: location as string,
      paymentStatus: paymentStatus as string,
      city: city as string
    },
    userRole // pass role
  );

  console.log(
    "Records Fetched:",
    result.data.records.length,
    "Total Records Count:",
    result.pagination.total
  );
  console.log(
    "Monthly Data Count:",
    result.data.monthlyData.length,
    "Sensitive fields masked:",
    userRole === "VIEW_ADMIN"
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Customer analytics fetched successfully",
    data: result.data,
    pagination: result.pagination,
  });
});




// const getCustomerAnalytics = catchAsync(async (req: Request, res: Response) => {
//   const {
//     startDate,
//     endDate,
//     page = "1",
//     limit = "10",
//     subscriptionStatus,
//     customerName,
//     location,
//     paymentStatus,
//     city,
//   } = req.query;

//   console.log("Controller - Received query:", {
//     startDate,
//     endDate,
//     subscriptionStatus,
//     customerName,
//     location,
//     paymentStatus,
//     city
//   });

//   // Get logged-in user role
//   const userRole = (req.user as any)?.role;
//   console.log("Controller - User Role:", userRole);

//   // ---------------- Normalize paymentStatus ----------------
//   const normalizedPaymentStatus = paymentStatus ? (paymentStatus as string).toLowerCase() : undefined;

//   console

//   const result = await AnalyticsService.getCustomerAnalytics(
//     startDate as string,
//     endDate as string,
//     Number(page),
//     Number(limit),
//     {
//       subscriptionStatus: subscriptionStatus as string,
//       customerName: customerName as string,
//       location: location as string,
//       paymentStatus: normalizedPaymentStatus, // small case send
//       city: city as string
//     },
//     userRole
//   );

//   console.log(
//     "Controller - Records Fetched:", result.data.records.length,
//     "Total Records Count:", result.pagination.total
//   );
//   console.log(
//     "Controller - Monthly Data Count:", result.data.monthlyData.length,
//     "Sensitive fields masked:", userRole === "VIEW_ADMIN"
//   );

//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Customer analytics fetched successfully",
//     data: result.data,
//     pagination: result.pagination,
//   });
// });

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
    const {
      startDate,
      endDate,
      subscriptionStatus,
      customerName,
      location,
      paymentStatus,
      city
    } = req.query;

    console.log("🚀 Export request received with filters:", {
      startDate,
      endDate,
      subscriptionStatus,
      customerName,
      location,
      paymentStatus,
      city
    });

    // Export all filtered data
    const result = await AnalyticsService.getMerchantAnalyticsExport(
      startDate as string,
      endDate as string,
      1, // page ignored
      0, // 0 = export all
      {
        subscriptionStatus: subscriptionStatus as string,
        customerName: customerName as string,
        location: location as string,
        paymentStatus: paymentStatus as string,
        city: city as string
      }
    );

    console.log("🔹 Aggregated records count:", result.records.length);
    console.log("🔸 Sample records:", result.records.slice(0, 5));

    const columns = [
      { header: "Business Name", key: "customerName" },
      // { header: "Last Name", key: "lastName" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Location", key: "location" },
      { header: "Subscription Status", key: "subscriptionStatus" },
      { header: "Payment Status", key: "paymentStatus" },
      { header: "Points Accumulated", key: "pointsAccumulated" },
      { header: "Points Redeemed", key: "pointsRedeemed" },
      { header: "Total Revenue", key: "totalRevenue" },
      { header: "Joining Date", key: "date" },
    ];

    const buffer = await generateExcelBuffer({
      sheetName: "Merchant Analytics",
      columns,
      rows: result.records,
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

    console.log("🚀 Customer Records export request:", { startDate, endDate });

    // -------- Fetch Records --------
    const result = await AnalyticsService.getCustomerAnalytics(
      startDate as string,
      endDate as string,
      1,
      0, // limit 0 = all records
      {}
    );

    const records = result.data.records;

    console.log("🔹 Records count:", records.length);
    console.log("🔸 Sample records:", records.slice(0, 5));

    // -------- Excel Columns --------
    const columns = [
      { header: "User ID", key: "userId" },
      { header: "Custom ID", key: "customUserId" },
      { header: "Customer Name", key: "customerName" },
      { header: "Location", key: "location" },
      { header: "Subscription Status", key: "subscriptionStatus" },
      { header: "Payment Status", key: "paymentStatus" },
      { header: "Points Accumulated", key: "pointsAccumulated" },
      { header: "Points Redeemed", key: "pointsRedeemed" },
      { header: "Revenue", key: "totalRevenue" },
      { header: "Date", key: "date" },
    ];

    // -------- Generate Excel --------
    const buffer = await generateExcelBuffer({
      sheetName: "Customer Records",
      columns,
      rows: records,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=customer-records.xlsx`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  }
);


const getPointRedeemedAnalytics = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await AnalyticsService.getPointRedeemedAnalytics({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page,
    limit,
  })
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Point redeemed analytics fetched successfully",
    data: { data: result.data, timeRange: result.timeRange },
    pagination: result.pagination
  })
})
const exportPointRedeemedAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  await AnalyticsService.exportPointRedeemedAnalytics(res, startDate as string, endDate as string);
});
const getRevenuePerUser = catchAsync(async (req: Request, res: Response) => {

  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await AnalyticsService.getRevenuePerUser({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page,
    limit,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Revenue per user analytics fetched successfully",
    data: { data: result.data, timeRange: result.timeRange },
    pagination: result.pagination
  })
})
const exportRevenuePerUser = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  await AnalyticsService.exportRevenuePerUser(res, startDate as string, endDate as string);
});

const getCashCollectionAnalytics = catchAsync(async (req: Request, res: Response) => {

  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await AnalyticsService.getCashCollectionAnalytics({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page,
    limit,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cash collection analytics fetched successfully",
    data: { data: result.data, timeRange: result.timeRange },
    pagination: result.pagination
  })
})
const exportCashCollectionAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  await AnalyticsService.exportCashCollectionAnalytics(res, startDate as string, endDate as string);
});


const getCashReceivableAnalytics = catchAsync(async (req: Request, res: Response) => {

  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await AnalyticsService.getCashReceivableAnalytics({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page,
    limit,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cash receivable analytics fetched successfully",
    data: { data: result.data, timeRange: result.timeRange },
    pagination: result.pagination
  })
})



const exportCashReceivableAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  await AnalyticsService.exportCashReceivableAnalytics(res, startDate as string, endDate as string);
});
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
  exportPointRedeemedAnalytics,
  getRevenuePerUser,
  exportRevenuePerUser,
  getCashCollectionAnalytics,
  exportCashCollectionAnalytics,
  getCashReceivableAnalytics,
  exportCashReceivableAnalytics
};
