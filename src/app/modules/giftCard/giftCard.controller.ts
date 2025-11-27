import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { GiftCardService } from "./giftCard.service";
import { buyGiftCardSchema, createGiftCardSchema, findByUniqueIdSchema } from "./iftCard.validation";
import { IUser } from "../user/user.interface";
import QueryBuilder from "../../../util/queryBuilder";

const buyGiftCard = catchAsync(async (req: Request, res: Response) => {
  const { giftCardId } = await buyGiftCardSchema.parseAsync(req.body);
  console.log("GiftCardController.buyGiftCard -> giftCardId", giftCardId);

  const userId = (req.user as IUser)?._id?.toString();
  if (!userId) throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");

  const result = await GiftCardService.buyGiftCard({ giftCardId, userId });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Gift card purchased successfully",
    data: result,
  });
});

// GET /api/v1/gift-card/my-giftcards
const getAllUserGiftCards = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)._id; // from auth middleware

  const giftCards = await GiftCardService.listUserGiftCards (userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User gift cards fetched successfully",
    data: giftCards
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
  const merchantId = (req.user as any)?._id;
  
  if (!merchantId) throw new Error("Merchant not authenticated");

  // attach merchantId to payload
  const payload = { ...req.body, merchantId };

  const result = await GiftCardService.createGiftCard(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Gift card created successfully",
    data: result,
  });
});

// GET /api/v1/gift-card/digital/list

const listAllDigitalCards = catchAsync(async (req: Request, res: Response) => {

 
  const userId = (req.user as IUser)?._id?.toString();
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID not found");
  }

  const result = await GiftCardService.listDigitalCardsByUser(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All digital cards fetched successfully",
    data: result,
  });
});














// GET /api/v1/gift-card
const getAllGiftCard = catchAsync(async (req: Request, res: Response) => {
  // শুরুতে সব giftcards query
  const baseQuery = GiftCardService.getAllGiftCardById(); // returns Query<IGiftCard[]>

  // QueryBuilder
  const qb = new QueryBuilder(baseQuery, req.query)
    .search(["title", "code"]) // search title or code
    .filter()
    .sort()
    .paginate()
    .fields();

  // execute query
  const result = await qb.modelQuery;

  // pagination info
  const paginationInfo = await qb.getPaginationInfo();

  if (!result || result.length === 0)
    throw new ApiError(StatusCodes.NOT_FOUND, "Gift cards not found");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Gift cards fetched successfully",
    data: result,
    pagination: paginationInfo,
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
  sendResponse(res, 
    { statusCode: StatusCodes.OK,
      success: true,
      data: result, 
      message: "Gift card updated" });
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
  listAllDigitalCards,
  getAllUserGiftCards,
  createGiftCard,
  getAllGiftCard,
  getGiftCard,
  updateGiftCard,
  deleteGiftCard,
};
