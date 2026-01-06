// src/app/modules/points/point.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

import { PointService } from "./transection.service";

// User/Admin: Get Transactions
const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;
  const typeParam = req.query.type as string;
  let type: "EARN" | "USE" | undefined;

  if (typeParam === "earn") type = "EARN";
  if (typeParam === "use") type = "USE";

  const transactions = await PointService.getTransactions(userId, type);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Point transactions fetched successfully",
    data: transactions,
  });
});

// User/Admin: Get Points Summary
const getSummary = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id;

  const summary = await PointService.getPointsSummary(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Points summary fetched successfully",
    data: summary,
  });
});

export const PointController = {
  getTransactions,
  getSummary,
};
