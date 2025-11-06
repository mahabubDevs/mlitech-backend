import { Request, Response } from "express";
import * as path from "path";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";

import { ICreateGame, IUpdateGame } from "./game.interface";
import { GameService } from "./game.service";
import { createGameZodSchema, updateGameZodSchema } from "./game.validation";

// Admin: Create Game
const createGame = catchAsync(async (req: Request, res: Response) => {
  let payloadData: any = {};

  if (req.body.data) {
    try {
      payloadData = JSON.parse(req.body.data);
    } catch {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid JSON in 'data' field");
    }
  }

  const payload: ICreateGame = {
    ...payloadData,
    createdBy: (req.user as any)?._id,
  };

  if (req.files && (req.files as any).image && (req.files as any).image[0]) {
    const fullPath = (req.files as any).image[0].path;
    const filename = fullPath.split(path.sep).pop();
    payload.image = `/images/${filename}`;
  }

  const parsedPayload = createGameZodSchema.parse(payload);
  const result = await GameService.createGameInDB(parsedPayload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Game created successfully",
    data: result,
  });
});

// Admin: Update Game
const updateGame = catchAsync(async (req: Request, res: Response) => {
  let payloadData: any = {};

  if (req.body.data) {
    try {
      payloadData = JSON.parse(req.body.data);
    } catch {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid JSON in 'data' field");
    }
  }

  const payload: IUpdateGame = { ...payloadData };

  if (req.files && (req.files as any).image && (req.files as any).image[0]) {
    const fullPath = (req.files as any).image[0].path;
    const filename = fullPath.split(path.sep).pop();
    payload.image = `/images/${filename}`;
  }

  const parsedPayload = updateGameZodSchema.parse(payload);
  const result = await GameService.updateGameInDB(req.params.id, parsedPayload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Game updated successfully",
    data: result,
  });
});

// Admin: Delete Game
const deleteGame = catchAsync(async (req: Request, res: Response) => {
  const result = await GameService.deleteGameFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Game deleted successfully",
    data: result,
  });
});

// Admin: Toggle Active/Inactive
const toggleGameStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await GameService.toggleGameStatusInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.isActive ? "Game activated" : "Game blocked",
    data: result,
  });
});

// User: Get All Games
const getGames = catchAsync(async (req: Request, res: Response) => {
  const result = await GameService.getGamesFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Games fetched successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

// User: Get Single Game
const getSingleGame = catchAsync(async (req: Request, res: Response) => {
  const result = await GameService.getSingleGameFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Game fetched successfully",
    data: result,
  });
});

export const GameController = {
  createGame,
  updateGame,
  deleteGame,
  toggleGameStatus,
  getGames,
  getSingleGame,
};
