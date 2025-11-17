import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { SalesRepService } from "./salesRep.service";
import { JwtPayload } from "jsonwebtoken";

const createSalesRepData = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  await SalesRepService.createSalesRepData(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sales repo data created successfully",
  });
});
const getSalesRepData = catchAsync(async (req: Request, res: Response) => {
  const result = await SalesRepService.getSalesRepData(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sales repo data retrieved successfully",
    data: result.salesRep,
    pagination: result.pagination,
  });
});

const updateUserAcknowledgeStatus = catchAsync(
  async (req: Request, res: Response) => {
    await SalesRepService.updateUserAcknowledgeStatus(req.params.id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Acknowledge status updated successfully",
    });
  }
);
const generateToken = catchAsync(async (req: Request, res: Response) => {
  await SalesRepService.updateUserAcknowledgeStatus(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Token generated successfully",
  });
});

export const SalesRepController = {
  createSalesRepData,
  getSalesRepData,
  updateUserAcknowledgeStatus,
  generateToken,
};
