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

export const SalesRepController = {
  createSalesRepData,
};
