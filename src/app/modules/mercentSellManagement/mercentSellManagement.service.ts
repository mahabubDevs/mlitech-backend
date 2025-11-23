// merchantSellManagement.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { calculateSchema, completeTransactionSchema, findCustomerSchema } from "./mercentSellManagement.validation";
import { MerchantSellManagementService } from "./mercentSellManagement.controller";



const findCustomer = catchAsync(async (req: Request, res: Response) => {
  const validated = await findCustomerSchema.parseAsync(req.query);

  const result = await MerchantSellManagementService.findCustomerFromDB(
    validated.cardId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Customer data fetched successfully",
    data: result,
  });
});

const calculate = catchAsync(async (req: Request, res: Response) => {
  const validated = await calculateSchema.parseAsync(req.body);

  const result = await MerchantSellManagementService.calculateFromDB(validated);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Calculation successful",
    data: result,
  });
});

const completeTransaction = catchAsync(async (req: Request, res: Response) => {
  const validated = await completeTransactionSchema.parseAsync(req.body);

  const payload = {
    ...validated,
    merchantId: (req.user as any)?._id,
  };

  const result =
    await MerchantSellManagementService.completeTransactionToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transaction completed successfully",
    data: result,
  });
});

export const MerchantSellManagementController = {
  findCustomer,
  calculate,
  completeTransaction,
};
