import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../../shared/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ReferralService } from "./referral.service";

const getMyReferredUser = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await ReferralService.getMyReferredUser(user._id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Referred users fetched successfully",
        data: result,
    });
})


const verifyReferral = catchAsync(async (req: Request, res: Response) => {


    const result = await ReferralService.verifyReferral(req.body.referralId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Refferal Id is valid",
        data: result,
    });
});
export const ReferralController = {
    getMyReferredUser,
    verifyReferral
}