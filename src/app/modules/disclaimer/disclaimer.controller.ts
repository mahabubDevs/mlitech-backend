import { Request, Response } from "express";
import { DisclaimerServices } from "./disclaimer.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";

// create or update disclaimer
const createUpdateDisclaimer = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    const result = await DisclaimerServices.createUpdateDisclaimer(
      payload,
      user as JwtPayload
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Disclaimer updated successfully",
      data: result,
    });
  }
);

// get disclaimer by type
const getDisclaimerByType = catchAsync(async (req: Request, res: Response) => {
  const type = req.params.type;
  const result = await DisclaimerServices.getAllDisclaimer(type);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Disclaimer fetched successfully",
    data: result,
  });
});

export const DisclaimerController = {
  createUpdateDisclaimer,
  getDisclaimerByType,
};
