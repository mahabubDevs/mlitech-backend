import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { GiftCardService } from "./giftCard.service";
import { buyGiftCardSchema, createGiftCardSchema, findByUniqueIdSchema } from "./iftCard.validation";
import { IUser } from "../user/user.interface";

const buyGiftCard = catchAsync(async (req: Request, res: Response) => {
  const validated = await buyGiftCardSchema.parseAsync(req.body);

  // merchantId should come from token
  const merchantId = (req.user as IUser)?._id?.toString();

  if (!merchantId) throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");

  const result = await GiftCardService.buyGiftCard({ ...validated, merchantId });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Gift card purchased successfully",
    data: result,
  });
});

const findByUniqueId = catchAsync(async (req: Request, res: Response) => {
  const parsed = await findByUniqueIdSchema.parseAsync(req.query);
  const result = await GiftCardService.findCustomerByUniqueCardId(parsed.uniqueId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Digital card fetched",
    data: result,
  });
});

const getGiftCardsByDigital = catchAsync(async (req: Request, res: Response) => {
  const digitalId = req.params.digitalId;
  const result = await GiftCardService.getGiftCardsByDigitalCard(digitalId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Gift cards fetched",
    data: result,
  });
});

const createGiftCard = catchAsync(async (req: Request, res: Response) => {
  const validated = await createGiftCardSchema.parseAsync(req.body);

  // merchantId comes from token
const merchantId = (req.user as IUser)?._id?.toString();

  if (!merchantId) throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");

  const result = await GiftCardService.createGiftCard({ ...validated, merchantId });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Gift card created",
    data: result,
  });
});

const getGiftCard = catchAsync(async (req: Request, res: Response) => {
  const result = await GiftCardService.getGiftCardById(req.params.id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Gift card not found");
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, data: result, message: "Gift card" });
});

const updateGiftCard = catchAsync(async (req: Request, res: Response) => {
  const result = await GiftCardService.updateGiftCard(req.params.id, req.body);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Gift card not found");
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, data: result, message: "Gift card updated" });
});

const deleteGiftCard = catchAsync(async (req: Request, res: Response) => {
  const result = await GiftCardService.deleteGiftCard(req.params.id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Gift card not found");
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, data: result, message: "Gift card deleted" });
});

export const GiftCardController = {
  buyGiftCard,
  findByUniqueId,
  getGiftCardsByDigital,
  createGiftCard,
  getGiftCard,
  updateGiftCard,
  deleteGiftCard,
};
