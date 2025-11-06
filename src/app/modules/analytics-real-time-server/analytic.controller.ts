import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ServerHealthService } from "./analytic.service";

// Get current server health
const getServerStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await ServerHealthService.getServerData();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Server health data fetched successfully",
    data,
  });
});

// Get server health logs with query
const getServerLogs = catchAsync(async (req: Request, res: Response) => {
  const data = await ServerHealthService.getServerLogs(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Server health logs fetched successfully",
    data,
  });
});

// Get API latency
const getApiLatency = catchAsync(async (req: Request, res: Response) => {
  const data = await ServerHealthService.getApiLatency();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "API latency fetched successfully",
    data,
  });
});

const getErrorRate = catchAsync(async (req: Request, res: Response) => {
  const data = await ServerHealthService.getErrorRateLast60Minutes();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "API error rate fetched successfully",
    data,
  });
});



// controller/analytic.controller.ts
const sendMetrics = catchAsync(async (req: Request, res: Response) => {
  const data = await ServerHealthService.saveMetrics(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Metrics saved successfully",
    data,
  });
});

// Call Metrics
const getCallMetrics = catchAsync(async (req: Request, res: Response) => {
  const data = await ServerHealthService.getCallMetrics();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Call metrics fetched successfully",
    data,
  });
});

// Crash-Free Users
const getCrashFreeUsers = catchAsync(async (req: Request, res: Response) => {
  const data = await ServerHealthService.getCrashFreeUsers();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Crash-free users fetched successfully",
    data,
  });
});

// App Version Stats
const getAppVersionStats = catchAsync(async (req: Request, res: Response) => {
  const data = await ServerHealthService.getAppVersionStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "App version stats fetched successfully",
    data,
  });
});


export const ServerHealthController = {
  getServerStatus,
  getServerLogs,
  getApiLatency,
  getErrorRate,


  sendMetrics,
  getCallMetrics,
  getCrashFreeUsers,
  getAppVersionStats
};
