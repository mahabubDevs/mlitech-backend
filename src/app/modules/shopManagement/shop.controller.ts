import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";

import { ICreateShop, IUpdateShop } from "./shop.interface";
import { ShopService } from "./shop.service";
import { createShopZodSchema, updateShopZodSchema } from "./shop.validation";

// Admin: Create Shop
const createShop = catchAsync(async (req: Request, res: Response) => {
  // সরাসরি req.body থেকে JSON নাও
  const payload: ICreateShop = {
    ...req.body,
    createdBy: (req.user as any)?._id,
  };

  // Validation
  const parsedPayload = createShopZodSchema.parse(payload);

  // Create in DB
  const result = await ShopService.createShopInDB(parsedPayload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Shop bundle created successfully",
    data: result,
  });
});

// Admin: Update Shop
const updateShop = catchAsync(async (req: Request, res: Response) => {
  let payloadData: any = {};

  // parse req.body.data if exists (JSON string)
  if (req.body.data) {
    try {
      payloadData = JSON.parse(req.body.data);
    } catch {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid JSON in 'data' field");
    }
  } else {
    payloadData = req.body; // fallback
  }

  const payload: IUpdateShop = { ...payloadData };

  // Validate
  const parsedPayload = updateShopZodSchema.parse(payload);

  // Update
  const result = await ShopService.updateShopInDB(req.params.id, parsedPayload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Shop bundle updated successfully",
    data: result,
  });
});

// Admin: Delete Shop
const deleteShop = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.deleteShopFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Shop bundle deleted successfully",
    data: result,
  });
});

// Admin: Toggle Active/Block
const toggleShopStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.toggleShopStatusInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.status === "active" ? "Shop bundle activated" : "Shop bundle blocked",
    data: result,
  });
});

// User/Admin: Get All Shops
const getShops = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.getShopsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Shop bundles fetched successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

// User/Admin: Get Single Shop
const getSingleShop = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.getSingleShopFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Shop bundle fetched successfully",
    data: result,
  });
});

export const ShopController = {
  createShop,
  updateShop,
  deleteShop,
  toggleShopStatus,
  getShops,
  getSingleShop,
};
