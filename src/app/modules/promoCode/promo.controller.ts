import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { IData } from "../../../types/auth";

import { ICreatePromo, IUpdatePromo, IApplyPromo } from "./promo.interface";
import { PromoService } from "./promo.service";

// Admin create
const createPromo = catchAsync(async (req: Request, res: Response) => {
  const payload: ICreatePromo = req.body.data ? JSON.parse(req.body.data) : { ...req.body };
  payload.createdBy = (req.user as any)?._id;

  if (req.file) {
    payload.image = `/images/${(req.file.path || (req.file as any).location).split("/").pop()}`;
  }

  const result = await PromoService.createPromoInDB(payload);
  sendResponse(res, 
    { success: true, 
      statusCode: StatusCodes.CREATED, 
      message: "Promo created successfully", 
      data: result 
    } as IData<typeof result>);
});

// Admin update
const updatePromo = catchAsync(async (req: Request, res: Response) => {
  const payload: IUpdatePromo = req.body.data ? JSON.parse(req.body.data) : { ...req.body };

  if (req.file) {
    payload.image = `/images/${(req.file.path || (req.file as any).location).split("/").pop()}`;
  }

  const result = await PromoService.updatePromoInDB(req.params.id, payload);
  sendResponse(res, 
    { success: true, 
      statusCode: StatusCodes.OK, 
      message: "Promo updated successfully", 
      data: result 
    } as IData<typeof result>);
});

// Admin delete
const deletePromo = catchAsync(async (req: Request, res: Response) => {
  const result = await PromoService.deletePromoFromDB(req.params.id);
  sendResponse(res, 
    { success: true, 
      statusCode: StatusCodes.OK, 
      message: "Promo deleted successfully", 
      data: result 
    } as IData<typeof result>);
});

// Admin toggle active/inactive
const togglePromoStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await PromoService.togglePromoStatusInDB(req.params.id);
  sendResponse(res, 
    { success: true, 
      statusCode: StatusCodes.OK, 
      message: result.isActive ? "Promo activated" : "Promo blocked", 
      data: result 
    } as IData<typeof result>);
});

// Get all promos
const getPromos = catchAsync(async (req: Request, res: Response) => {
  const result = await PromoService.getPromosFromDB(req.query);
  sendResponse(res, 
    { success: true, 
      statusCode: StatusCodes.OK, 
      message: "Promos fetched successfully", 
      data: result.data, pagination: 
      result.pagination 
    } as IData<typeof result.data>);
});

// Get single promo
const getSinglePromo = catchAsync(async (req: Request, res: Response) => {
  const result = await PromoService.getSinglePromoFromDB(req.params.id);
  sendResponse(res, 
    { success: true, 
      statusCode: StatusCodes.OK, 
      message: "Promo fetched successfully", 
      data: result 
    } as IData<typeof result>);
});

// Apply promo (user)
const applyPromo = catchAsync(async (req: Request, res: Response) => {
  const payload: IApplyPromo = { ...req.body, userId: (req.user as any)?._id };
  const result = await PromoService.applyPromoCode(payload);
  sendResponse(res, 
    { success: true, 
      statusCode: StatusCodes.OK, 
      message: "Promo applied successfully", 
      data: result 
    } as IData<typeof result>);
});

export const PromoController = { 
  createPromo, 
  updatePromo, 
  deletePromo, 
  togglePromoStatus, 
  getPromos, 
  getSinglePromo, 
  applyPromo 
};
