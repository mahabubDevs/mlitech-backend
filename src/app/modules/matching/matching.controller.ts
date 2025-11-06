// src/app/modules/matching/matching.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MatchingService } from "./matching.service";
import { IData } from "../../../types/auth";

// Discover
const discoverUsers = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id; // req.user type-safe
  const result = await MatchingService.discoverUsersFromDB(userId, req.query);
  console.log(result.pagination,"test");

  const response: IData<typeof result.data> = {
  success: true,
  statusCode: StatusCodes.OK,
  message: "Users discovered successfully",
  data: result.data,
  pagination: result.pagination, // 🔹 এখানে meta নয়, pagination ব্যবহার করতে হবে
}

  sendResponse(res, response);
});

// Skip
const skipUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;
  const  targetUserId  = req.params.id;

  const result = await MatchingService.skipUserInDB(userId, targetUserId);
 

  const response: IData<typeof result> = {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User skipped successfully",
    data: result,
    // meta: result.pagination,
  };


  sendResponse(res, response);
});


// Match
const matchUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;
  const targetUserId = req.params.id;

  const result = await MatchingService.matchUserInDB(userId, targetUserId);

  const response: IData<typeof result> = {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.isMatched ? "Users matched successfully" : "Match pending",
    data: result,
  };

  sendResponse(res, response);
});

// Matched users list
const getMatchedUsers = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?._id;

  const matches = await MatchingService.getMatchedUsersFromDB(userId);

  const response: IData<typeof matches> = {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Matched users fetched successfully",
    data: matches,
  };

  sendResponse(res, response);
});

export const MatchingController = { 
  discoverUsers,
   skipUser ,
   matchUser ,
   getMatchedUsers
  };

