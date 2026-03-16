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
import { Sell } from "../mercentSellManagement/mercentSellManagement.model";
import { User } from "../../user/user.model";
import { sendNotification,  } from "../../../../helpers/notificationsHelper";
import { NotificationType } from "../../notification/notification.model";





const createTier = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  console.log("🟢 User ID from token:", user._id);

  // ✅ Decide which ID to use
  const filterId = user.isSubMerchant ? user.merchantId : user._id;
  console.log("🟢 Merchant/Sub-Merchant ID:", filterId);

  // -----------------------------
  // Fetch full user from DB to get businessName
  // -----------------------------
  const fullUser = await User.findById(filterId).select("_id firstName businessName");
  console.log("🟢 Full User from DB:", fullUser);

  // -----------------------------
  // 1️⃣ Validate Body
  // -----------------------------
  const validatedBody = await createTierSchema.parseAsync({
    ...req.body,
    pointsThreshold: Number(req.body.pointsThreshold),
    minTotalSpend: Number(req.body.minTotalSpend),
    isActive:
      req.body.isActive !== undefined
        ? Boolean(req.body.isActive)
        : undefined,
  });
  console.log("🟢 Validated Body:", validatedBody);


 // -----------------------------
  // Allowed Tier Names
  // -----------------------------
  const ALLOWED_TIERS = [
    "Gold Basic",
    "Gold Plus",
    "Platinum",
    "Platinum Plus",
    "Diamond",
  ];

  // ❌ Invalid Tier Name
  if (!ALLOWED_TIERS.includes(validatedBody.name)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid tier name. Allowed tiers: Gold Basic, Gold Plus, Platinum, Platinum Plus, Diamond"
    );
  }

  // -----------------------------
  // Prevent Duplicate Tier Name
  // -----------------------------
  const existingTier = await Tier.findOne({
    admin: filterId,
    name: validatedBody.name,
  });

  if (existingTier) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Tier "${validatedBody.name}" already exists for this merchant`
    );
  }




  const payload: Partial<ITier> = {
    ...validatedBody,
    admin: filterId,
    isActive: validatedBody.isActive ?? true,
  };
  console.log("🟢 Payload to DB:", payload);

  // -----------------------------
  // 2️⃣ Save Tier to DB
  // -----------------------------
  const result = await TierService.createTierToDB(payload);
  console.log("💾 Tier Saved:", result);

  // -----------------------------
  // 3️⃣ Audit Log
  // -----------------------------
  await AuditService.createLog(
    user._id,
    "CREATE_TIER",
    `Tier "${result.name}" created`
  );
  console.log("📝 Audit Log Created");

  // -----------------------------
  // 4️⃣ Send Notifications to Merchant's Customers (Sell model)
  // -----------------------------
  const customerIds = await Sell.find({ merchantId: filterId, status: "completed" })
    .distinct("userId"); // only unique customer IDs
  console.log("📋 Found Customer IDs:", customerIds);

  if (customerIds?.length) {
    const customers = await User.find({ _id: { $in: customerIds } })
      .select("_id firstName socketIds");
    console.log("👥 Customers fetched:", customers.map(c => c._id));

    const ids = customers.map((c) => c._id.toString());

    await sendNotification({
      userIds: ids,
      title: "New Tier Available!",
      body: `Merchant ${fullUser?.businessName} has created a new tier: "${result.name}". Check it out now!`,
      type: NotificationType.MANUAL,
      channel: { socket: true, push: true },
    });
    console.log("🔔 Notifications Sent to Customers");
  } else {
    console.log("⚠️ No customers to notify");
  }

  // -----------------------------
  // 5️⃣ Send Response
  // -----------------------------
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tier created successfully",
    data: result,
  });
  console.log("✅ Response sent to client");
});

const updateTier = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  console.log("🟢 User ID from token:", user._id);

  // -----------------------------
  // 1️⃣ Parse and Validate Body
  // -----------------------------
  const body = req.body.data ? JSON.parse(req.body.data) : req.body;
  const validatedBody = await updateTierSchema.parseAsync(body);
  console.log("🟢 Validated Body:", validatedBody);

  const payload: any = {
    ...(validatedBody.name && { name: validatedBody.name }),
    ...(validatedBody.pointsThreshold !== undefined && { pointsThreshold: Number(validatedBody.pointsThreshold) }),
    ...(validatedBody.reward && { reward: validatedBody.reward }),
    ...(validatedBody.accumulationRule && { accumulationRule: validatedBody.accumulationRule }),
    ...(validatedBody.redemptionRule && { redemptionRule: validatedBody.redemptionRule }),
    ...(validatedBody.minTotalSpend !== undefined && { minTotalSpend: Number(validatedBody.minTotalSpend) }),
    ...(validatedBody.isActive !== undefined && { isActive: Boolean(validatedBody.isActive) }),
  };
  console.log("🟢 Payload to DB:", payload);

  // -----------------------------
  // 2️⃣ Update Tier in DB
  // -----------------------------
  const result = await TierService.updateTierToDB(req.params.id, payload);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "Tier not found");
  console.log("💾 Tier Updated:", result);

  // -----------------------------
  // 3️⃣ Audit Log
  // -----------------------------
  await AuditService.createLog(
    user._id,
    "UPDATE_TIER",
    `Tier "${result.name}" updated`
  );
  console.log("📝 Audit Log Created");

  // -----------------------------
  // 4️⃣ Send Notifications to Merchant's Customers (Sell model)
  // -----------------------------
  const filterId = user.isSubMerchant ? user.merchantId : user._id;

  const fullUser = await User.findById(filterId).select("_id firstName businessName");
  console.log("🟢 Full User from DB:", fullUser);

  const customerIds = await Sell.find({ merchantId: filterId, status: "completed" })
    .distinct("userId");
  console.log("📋 Found Customer IDs:", customerIds);

  if (customerIds?.length) {
    const customers = await User.find({ _id: { $in: customerIds } })
      .select("_id firstName socketIds");
    console.log("👥 Customers fetched:", customers.map(c => c._id));

    const ids = customers.map(c => c._id.toString());

    await sendNotification({
      userIds: ids,
      title: "Tier Updated!",
      body: `Merchant ${fullUser?.businessName} has updated a tier: "${result.name}". Check it out now!`,
      type: NotificationType.MANUAL,
      channel: { socket: true, push: true },
    });


    console.log(`🔔 Notifications Sent to ${customers.length} Customers`);
  } else {
    console.log("⚠️ No customers to notify");
  }

  // -----------------------------
  // 5️⃣ Send Response
  // -----------------------------
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tier updated successfully",
    data: result,
  });
  console.log("✅ Response sent to client");
});

const getTier = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;

  // ✅ Decide which ID to use for filtering
  const filterId = user.isSubMerchant ? user.merchantId : user._id;

  // Build the query
  const queryBuilder = new QueryBuilder(
    Tier.find(),
    {
      ...req.query,
      admin: filterId, // 🔥 only change applied here
    }
  );

  // Apply query builder features
  queryBuilder
    .search(["name", "description"])
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


const getTierByUserId = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  console.log("🔥 Requested userId:", userId);
  console.log("🌐 Incoming query params:", req.query);

  // Build query with provided userId
  const queryBuilder = new QueryBuilder(
    Tier.find(),
    {
      ...req.query,
      admin: userId, // 🔥 filter by given userId
    }
  );

  queryBuilder
    .search(["name", "description"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const tiers = await queryBuilder.modelQuery;
  console.log("✅ Retrieved tiers:", tiers);

  const pagination = await queryBuilder.getPaginationInfo();
  console.log("📊 Pagination info:", pagination);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User tiers retrieved successfully",
    data: tiers,
    pagination,
  });
});


export const TierController = {
  createTier,
  updateTier,
  getTier,
  getSingleTier,
  deleteTier,
  getTierByUserId
};
