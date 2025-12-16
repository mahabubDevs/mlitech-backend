import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AuditService } from "./audit.service";

const getAuditLogs = catchAsync(async (req, res) => {
  const logs = await AuditService.getAllLogs(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Audit logs retrieved successfully",
    
    data: logs,
  });
});


export const AuditController = {
  getAuditLogs,
};
