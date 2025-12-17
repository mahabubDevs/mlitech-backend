import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { TierService } from "./tier.service";
import { createTierSchema, updateTierSchema } from "./tier.validation";
import { ITier } from "./tier.interface";

import { Tier } from "./tier.model";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import ApiError from "../../../../errors/ApiErrors";
import QueryBuilder from "../../../../util/queryBuilder";
import { AuditService } from "../../auditLog/audit.service";





const createTier = catchAsync(async (req: Request, res: Response) => {
  const validatedBody = await createTierSchema.parseAsync({
    ...req.body,
    pointsThreshold: Number(req.body.pointsThreshold),
    minTotalSpend: Number(req.body.minTotalSpend),
    isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : undefined,
  });

  const payload: Partial<ITier> = {
    ...validatedBody,
    admin: (req.user as any)?._id,
    isActive: validatedBody.isActive ?? true,
  };

  const result = await TierService.createTierToDB(payload);

    // ✅ Audit Log creation
  await AuditService.createLog(
    (req.user as any)?._id,           // userId
    "CREATE_TIER",                    // actionType
    `Tier "${result.name}" created`    // details
  );


  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tier created successfully",
    data: result,
  });
});

const updateTier = catchAsync(async (req: Request, res: Response) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body;
  const validatedBody = await updateTierSchema.parseAsync(body);

  const payload: any = {
    ...(validatedBody.name && { name: validatedBody.name }),
    ...(validatedBody.pointsThreshold !== undefined && { pointsThreshold: Number(validatedBody.pointsThreshold) }),
    ...(validatedBody.reward && { reward: validatedBody.reward }),
    ...(validatedBody.accumulationRule && { accumulationRule: validatedBody.accumulationRule }),
    ...(validatedBody.redemptionRule && { redemptionRule: validatedBody.redemptionRule }),
    ...(validatedBody.minTotalSpend !== undefined && { minTotalSpend: Number(validatedBody.minTotalSpend) }),
    ...(validatedBody.isActive !== undefined && { isActive: Boolean(validatedBody.isActive) }),
  };

  const result = await TierService.updateTierToDB(req.params.id, payload);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Tier not found");

    // ✅ Audit Log creation
  await AuditService.createLog(
    (req.user as any)?._id,           // userId
    "UPDATE_TIER",                    // actionType
    `Tier "${result.name}" updated`    // details
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tier updated successfully",
    data: result,
  });
});

const getTier = catchAsync(async (req: Request, res: Response) => {
  // Build the query
  const queryBuilder = new QueryBuilder(
    Tier.find(), // base model query
    {
      ...req.query,
      admin: (req.user as any)?._id, // add adminId if logged in
    }
  );

  // Apply query builder features
  queryBuilder
    .search(['name', 'description']) // searchable fields in Tier
    .filter()
    .sort()
    .paginate()
    .fields();

  // Execute query
  const tiers = await queryBuilder.modelQuery;

  // Get pagination info
  const pagination = await queryBuilder.getPaginationInfo();

  // Send response
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tiers retrieved successfully",
    data: tiers,
     pagination,
  });
});

const getSingleTier = catchAsync(async (req: Request, res: Response) => {
  const result = await TierService.getSingleTierFromDB(req.params.id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Tier not found");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tier retrieved successfully",
    data: result,
  });
});

const deleteTier = catchAsync(async (req: Request, res: Response) => {
  const result = await TierService.deleteTierToDB(req.params.id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Tier not found");

    // ✅ Audit Log creation
  await AuditService.createLog(
    (req.user as any)?._id,           // userId
    "DELETE_TIER",                    // actionType
    `Tier "${result.name}" deleted`    // details
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tier deleted successfully",
    data: result,
  });
});

export const TierController = {
  createTier,
  updateTier,
  getTier,
  getSingleTier,
  deleteTier,
};
