import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { PackageService } from "./package.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";

const createPackage = catchAsync(async (req: Request, res: Response) => {
    const { title, description, price, duration, paymentType, features, credit, loginLimit } = req.body;

    if(!title || !features?.length) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Title and features are required");
    }

    const payload: Partial<any> = {
        title,
        description,
        price: Number(price),
        duration,
        paymentType,
        features,
        credit: Number(credit),
        loginLimit: Number(loginLimit),
        admin: (req.user as any)?._id
    };

    const result = await PackageService.createPackageToDB(payload);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Package created Successfully",
        data: result
    });
});

const updatePackage = catchAsync(async(req: Request, res: Response) => {
    const result = await PackageService.updatePackageToDB(req.params.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Package updated Successfully",
        data: result
    });
});

const getPackage = catchAsync(async(req: Request, res: Response) => {
    const result = await PackageService.getPackageFromDB(req.query.paymentType as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Packages retrieved Successfully",
        data: result
    });
});

const packageDetails = catchAsync(async(req: Request, res: Response) => {
    const result = await PackageService.getPackageDetailsFromDB(req.params.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Package Details retrieved Successfully",
        data: result
    });
});

const deletePackage = catchAsync(async(req: Request, res: Response) => {
    const result = await PackageService.deletePackageToDB(req.params.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Package deleted Successfully",
        data: result
    });
});

export const PackageController = {
    createPackage,
    updatePackage,
    getPackage,
    packageDetails,
    deletePackage
};
