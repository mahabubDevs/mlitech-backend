import { Request, Response } from "express";
import { ReportService } from "./report.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { REPORT_STATUS } from "./report.interface";

// User creates report
const createReport = catchAsync(async (req: Request, res: Response) => {
  const {  reason } = req.body;
   const { id } = req.params;
  
  if (!req.user || !req.user._id) {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Authentication required",
      data: null,
    });
    return;
  }

  const reporterId = req.user._id; // auth middleware sets req.user

  const report = await ReportService.createReport(reporterId, id, reason);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Report created successfully",
    data: report,
  });
});

// Admin update report status / warning
const adminAction = catchAsync(async (req: Request, res: Response) => {
  const {  status, warning } = req.body;
   const { id } = req.params;
   if (!req.user || !req.user._id) {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Authentication required",
      data: null,
    });
    return;
  }
  const adminId = req.user._id;

  const report = await ReportService.adminAction(id, status as REPORT_STATUS, warning, adminId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Report updated successfully",
    data: report,
  });
});

// Admin get all reports
const getAllReports = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getAllReports(req.query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Reports fetched successfully",
    data: {
      meta: result.meta, // pagination info
      items: result.data,
    },
  });
});

// Admin get Single reports
const getSingleReports = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
  const reports = await ReportService.getSingleReports(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All reports fetched successfully",
    data: reports,
  });
});

export const ReportController = {
  createReport,
  adminAction,
  getAllReports,
  getSingleReports
};
