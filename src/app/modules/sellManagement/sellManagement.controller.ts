// import { Request, Response } from "express";
// import { StatusCodes } from "http-status-codes";
// import catchAsync from "../../../shared/catchAsync";
// import sendResponse from "../../../shared/sendResponse";
// import ApiError from "../../../errors/ApiErrors";
// import { IUser } from "../user/user.interface";
// import { SellManagementService } from "./sellManagement.service";


// // ======================
// // 1) GET DIGITAL CARD INFO
// // ======================
// const getDigitalCardForMerchant = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as IUser;

//   if (!user?._id) {
//     throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");
//   }

//   const uniqueId = req.params.uniqueId;

//   const result = await SellManagementService.getDigitalCardForMerchant(
//     user._id.toString(),
//     uniqueId
//   );

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Digital card with gift cards fetched successfully",
//     data: result,
//   });
// });


// // ======================
// // 2) CREATE APPLY REQUEST
// // ======================
// const createApplyRequest = catchAsync(async (req: Request, res: Response) => {
//   const merchant = req.user as IUser;
//   if (!merchant?._id) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");

//   const payload = req.body;

//   // ✅ Body থেকে userId নিতে হবে
//   const userId = payload.userId;
//   if (!userId) throw new ApiError(StatusCodes.BAD_REQUEST, "User ID is required in body");

//   const result = await SellManagementService.createApplyRequest(
//     userId,             // <-- user ID
//     merchant._id.toString(), 
//     payload
//   );

//   sendResponse(res, {
//     statusCode: StatusCodes.CREATED,
//     success: true,
//     message: "Gift card apply request created",
//     data: result,
//   });
// });



// const getUserRequests = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as IUser;

//   if (!user?._id) {
//     throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");
//   }

//   const result = await SellManagementService.getUserRequests(user._id.toString());

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "User apply requests fetched successfully",
//     data: result,
//   });
// });


// // ======================
// // 3) USER APPROVE / DENY
// // ======================
// const userApproveRequest = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as IUser;
//   console

//   if (!user?._id) {
//     throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");
//   }

//   const requestId = req.params.id;
//   const action = req.body.action; // approve / reject

//   const result = await SellManagementService.userApproveRequest(
//     user._id.toString(),
//     requestId,
//     action
//   );

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: `User ${action} successfully`,
//     data: result,
//   });
// });


// // ======================
// // 4) MERCHANT CONFIRM
// // ======================
// const merchantConfirmRequest = catchAsync(async (req: Request, res: Response) => {
//   const merchant = req.user as IUser;
//   if (!merchant?._id) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");

//   const requestId = req.params.requestId;

//   const result = await SellManagementService.merchantConfirmRequest(
//     merchant._id.toString(),
//     requestId
//   );

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Merchant confirmed successfully",
//     data: result,
//   });
// });




// export const SellManagementController = {
//   getDigitalCardForMerchant,
//   createApplyRequest,
//   userApproveRequest,
//   merchantConfirmRequest,
//   getUserRequests
// };
