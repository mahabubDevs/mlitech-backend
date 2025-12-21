import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./usermanagement.service";
import { AuditService } from "../auditLog/audit.service";
import { User } from "../user/user.model";
import ApiError from "../../../errors/ApiErrors";


// create user
const createUser = catchAsync(async (req: any, res: any) => {
  const result = await UserService.createUserToDB(req.body);

  // Audit log (any use করা হয়েছে)
  await AuditService.createLog(
    req.user?.email || "Unknown", // যিনি user create করেছে
    "CREATE_USER",
    `Created user: ${result.email} with role: ${result.role}`
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "User created successfully",
    data: result,
  });
});


const createMerchant = catchAsync(async (req: any, res: any) => {
  const result = await UserService.createMerchantToDB(req.body);

  // Audit log
  await AuditService.createLog(
    req.user?.email || "Unknown",
    "CREATE_MERCHANT",
    `Created merchant: ${result.email}, business: ${result.businessName}`
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Merchant created successfully",
    data: result,
  });
});



// get all users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const requestingUserRole = (req.user as any)?.role || "ADMIN";
  const result = await UserService.getAllUsersFromDB(requestingUserRole);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Users retrieved successfully",
    data: result,
  });
});

// get single user
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getSingleUserFromDB(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User retrieved successfully",
    data: result,
  });
});

// update user
const updateUser = catchAsync(async (req: any, res: Response) => {
  const result = await UserService.updateUserToDB(req.params.id, req.body);

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  // Audit log
  await AuditService.createLog(
    req.user?.email || "Unknown", // যিনি update করেছে
    "UPDATE_USER",
    `Updated user: ${result.email}`
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User updated successfully",
    data: result,
  });
});


// delete user
const deleteUser = catchAsync(async (req: any, res: any) => {
  const result = await UserService.deleteUserFromDB(req.params.id);

  // Audit log
  await AuditService.createLog(
    req.user?.email || "Unknown",
    "DELETE_USER",
    `Deleted user: ${req.params.id}`
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User deleted successfully",
    data: result,
  });
});


// toggle user status
const toggleUserStatus = catchAsync(async (req: any, res: any) => {
  const result = await UserService.toggleUserStatusFromDB(req.params.id);

  // Audit log
  await AuditService.createLog(
    req.user?.email || "Unknown", // action নেয়া user
    "TOGGLE_USER_STATUS",
    `Toggled status for user: ${result.email}, new status: ${result.status}`
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User status updated successfully",
    data: result,
  });
});


const getAllMerchants = catchAsync(async (req, res) => {
  const result = await UserService.getAllMerchants(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All merchants retrieved successfully",
    data: result.allmerchants,
    pagination: result.pagination,
  });
});

const getSingleMerchant = catchAsync(async (req, res) => {
  const result = await UserService.getSingleMerchant(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant retrieved successfully",
    data: result,
  });
});

const updateMerchant = catchAsync(async (req, res) => {
  const result = await UserService.updateMerchant(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant updated successfully",
    data: result,
  });
});

const deleteMerchant = catchAsync(async (req, res) => {
  await UserService.deleteMerchant(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant deleted successfully",
  });
});

const toggleMerchantStatus = catchAsync(async (req, res) => {
  const result = await UserService.toggleMerchantStatus(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant status updated successfully",
    data: result,
  });
});





export const UserController = {
  createUser,
  createMerchant,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
   getAllMerchants,
  getSingleMerchant,
  updateMerchant,
  deleteMerchant,
  toggleMerchantStatus,
};
