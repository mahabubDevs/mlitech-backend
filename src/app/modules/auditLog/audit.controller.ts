import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AuditService } from "./audit.service";

const getAuditLogs = catchAsync(async (req, res) => {
  const logs = await AuditService.getAllLogsExceptMerchant(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Audit logs retrieved successfully (merchant logs excluded)",
    data: logs,
  });
});


const getAuditLogsByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const logs = await AuditService.getLogsByUserId(
    userId,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User audit logs retrieved successfully",
    data: logs,
  });
});



export const AuditController = {
  getAuditLogs,
  getAuditLogsByUser
};
