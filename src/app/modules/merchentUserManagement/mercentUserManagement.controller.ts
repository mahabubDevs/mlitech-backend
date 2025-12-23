import { Request, Response } from "express";

import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./mercentUserManagement.service";

// ---------------- Create User ----------------
 const createUser = catchAsync(async (req: any, res: Response) => {
  const result = await UserService.createUserToDB(
    req.body,
    req.user.role,
    req.user.id
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "User created successfully",
    data: result,
  });
});

// ---------------- Get Merchant's Own Users ----------------
 const getMyUsers = catchAsync(async (req: any, res: Response) => {
  const users = await UserService.getUsersByMerchant(req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Users fetched successfully",
    data: users,
  });
});

// ---------------- Get Single User ----------------
 const getSingleUser = catchAsync(async (req: any, res: Response) => {
  const user = await UserService.getSingleUser(req.params.id, req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User fetched successfully",
    data: user,
  });
});

// ---------------- Update User ----------------
 const updateUser = catchAsync(async (req: any, res: Response) => {
  const user = await UserService.updateUser(req.params.id, req.body, req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User updated successfully",
    data: user,
  });
});

// ---------------- Delete User ----------------
 const deleteUser = catchAsync(async (req: any, res: Response) => {
  await UserService.deleteUser(req.params.id, req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User deleted successfully",
  });
});

// ---------------- Toggle Status ----------------
 const toggleUserStatus = catchAsync(async (req: any, res: Response) => {
  const result = await UserService.toggleUserStatus(req.params.id, req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User status updated successfully",
    data: result,
  });
});


export const MercentUserManagementController = {
    createUser,
    getMyUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
};
