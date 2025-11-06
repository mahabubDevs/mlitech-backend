import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { PackageService } from "./package.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";





const createPackage = catchAsync(async (req: Request, res: Response) => {
  const { title, features } = req.body;

  if (!title || title.trim() === "") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Title is required");
  }

  if (!features || !Array.isArray(features) || features.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Features field is required and must be a non-empty array");
  }

  const payload = {
    ...req.body,
    admin: (req.user as any)?._id,
  };

  console.log("Payload before DB save:", payload);

  const result = await PackageService.createPackageToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Package created Successfully",
    data: result,
  });
});


const updatePackage = catchAsync(async(req: Request, res: Response)=>{
    const result = await PackageService.updatePackageToDB(req.params.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Package updated Successfully",
        data: result
    })
})

const getPackage = catchAsync(async(req: Request, res: Response)=>{
    const result = await PackageService.getPackageFromDB(req.query.paymentType as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Package Retrieved Successfully",
        data: result
    })
})

const packageDetails = catchAsync(async(req: Request, res: Response)=>{
    const result = await PackageService.getPackageDetailsFromDB(req.params.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Package Details Retrieved Successfully",
        data: result
    })
})


const deletePackage = catchAsync(async(req: Request, res: Response)=>{
    const result = await PackageService.deletePackageToDB(req.params.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Package Deleted Successfully",
        data: result
    })
})

export const PackageController = {
    createPackage,
    updatePackage,
    getPackage,
    packageDetails,
    deletePackage
}