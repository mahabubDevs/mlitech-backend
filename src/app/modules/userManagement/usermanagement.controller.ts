import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { UserService } from "./usermanagement.service";

// ✅ Get All Users
const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsers();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

// ✅ Get Single User
const getSingleUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.getSingleUser(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

// ✅ View Report
const viewReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.viewReport(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Report fetched successfully",
    data: result,
  });
});

// ✅ Active / Inactive User
const activeInactiveUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.activeInactiveUser(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

export const UserController = {
  getAllUsers,
  getSingleUser,
  viewReport,
  activeInactiveUser,
};
