"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionController = void 0;
const http_status_codes_1 = require("http-status-codes");
const promotionMercent_service_1 = require("./promotionMercent.service");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const ApiErrors_1 = __importDefault(require("../../../../errors/ApiErrors"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const promotionMercent_model_1 = require("./promotionMercent.model");
const promotionMercent_model_2 = require("../../adminSellandTier/promotionMercent/promotionMercent.model");
const notificationsHelper_1 = require("../../../../helpers/notificationsHelper");
const notification_model_1 = require("../../notification/notification.model");
const digitalCard_model_1 = require("../../customer/digitalCard/digitalCard.model");
const rating_model_1 = require("../../customer/rating/rating.model");
const merchantCustomer_model_1 = require("../merchantCustomer/merchantCustomer.model");
const createPromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // body data parse
    const bodyData = req.body.data ? JSON.parse(req.body.data) : {};
    const { name, discountPercentage, promotionType, customerSegment, startDate, availableDays, endDate, grossValue, } = bodyData;
    if (!name || !customerSegment || !promotionType || !grossValue) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Required fields missing");
    }
    // IMAGE URL
    let imageUrl = undefined;
    if (req.files && req.files.image && req.files.image[0]) {
        const file = req.files.image[0];
        imageUrl = `/images/${file.filename}`;
    }
    // 🔑 USER from auth middleware
    const user = req.user;
    // ✅ APPLY YOUR LOGIC HERE
    const merchantId = user.isSubMerchant
        ? user.merchantId
        : user._id;
    if (!merchantId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Merchant ID not found");
    }
    const payload = {
        name,
        discountPercentage: Number(discountPercentage),
        promotionType,
        customerSegment,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        availableDays,
        image: imageUrl,
        merchantId, // ✅ ALWAYS merchant ID
        grossValue: Number(grossValue),
    };
    const result = yield promotionMercent_service_1.PromotionService.createPromotionToDB(payload);
    if (result) {
        yield (0, notificationsHelper_1.sendNotification)({
            userIds: [merchantId], // ✅ notify real merchant
            title: "Congratulations! promotion published",
            body: `Your promotion "${name}" has been published successfully`,
            type: notification_model_1.NotificationType.PROMOTION,
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion created successfully",
        data: result,
    });
}));
const getAllPromotions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.getAllPromotionsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotions retrieved successfully",
        data: result.promotions,
        pagination: result.pagination,
    });
}));
const getAllPromotionsOfAMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const filterId = user.isSubMerchant ? user.merchantId : user._id;
    const result = yield promotionMercent_service_1.PromotionService.getAllPromotionsOfAMerchant(filterId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotions retrieved successfully",
        data: result.promotions,
        pagination: result.pagination,
    });
}));
// const getPromotionsForUser = catchAsync(async (req: Request, res: Response) => {
//   const userId = (req.user as any)?._id;
//   if (!userId) {
//     throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID not found");
//   }
//   // 1️⃣ User segment
//   const userSegment = await PromotionService.getUserSegment(userId);
//   // 2️⃣ Today
//   const today = new Date();
//   const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
//   const todayDay = dayMap[today.getDay()];
//   // 3️⃣ Promotions
//   let promotions = await Promotion.find({
//     customerSegment: { $in: [userSegment, "all_customer"] },
//     status: "active",
//   })
//     .populate("merchantId", "website name")
//     .lean();
//   // 4️⃣ User digital cards
//   const digitalCards = await DigitalCard.find({ userId }).select("promotions");
//   const existingPromotionIds = digitalCards.flatMap(card =>
//     card.promotions
//       .map(p => p.promotionId?.toString())
//       .filter(Boolean) as string[]
//   );
//   // 5️⃣ Date + day + card filter
//   promotions = promotions.filter(promo => {
//     const startDate = new Date(promo.startDate);
//     const endDate = new Date(promo.endDate);
//     const isValidDate = today >= startDate && today <= endDate;
//     const days = promo.availableDays || [];
//     const isValidDay = days.includes("all") || days.includes(todayDay);
//     const isNotInUserCard = !existingPromotionIds.includes(promo._id.toString());
//     return isValidDate && isValidDay && isNotInUserCard;
//   });
//   // 🔥 6️⃣ Get average rating per promotion
//   const promotionIds = promotions.map(p => p._id);
//   const ratingsAgg = await Rating.aggregate([
//     {
//       $match: {
//         promotionId: { $in: promotionIds },
//       },
//     },
//     {
//       $group: {
//         _id: "$promotionId",
//         averageRating: { $avg: "$rating" },
//         totalRatings: { $sum: 1 },
//       },
//     },
//   ]);
//   // 🔹 Convert to map for fast lookup
//   const ratingMap = new Map(
//     ratingsAgg.map(r => [
//       r._id.toString(),
//       {
//         averageRating: Number(r.averageRating.toFixed(1)),
//         totalRatings: r.totalRatings,
//       },
//     ])
//   );
//   // 7️⃣ Attach rating to promotion
//   promotions = promotions.map(promo => {
//     const ratingData = ratingMap.get(promo._id.toString());
//     return {
//       ...promo,
//       averageRating: ratingData?.averageRating || 0,
//       totalRatings: ratingData?.totalRatings || 0,
//     };
//   });
//   // 8️⃣ Response
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Promotions retrieved successfully for user",
//     data: promotions,
//   });
// });
const getSinglePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.getSinglePromotionFromDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion retrieved successfully",
        data: result,
    });
}));
const updatePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bodyData = req.body.data ? JSON.parse(req.body.data) : Object.assign({}, req.body);
    const payload = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (bodyData.name && { name: bodyData.name })), (bodyData.discountPercentage && {
        discountPercentage: Number(bodyData.discountPercentage),
    })), (bodyData.promotionType && { promotionType: bodyData.promotionType })), (bodyData.customerSegment && {
        customerSegment: bodyData.customerSegment,
    })), (bodyData.startDate && { startDate: new Date(bodyData.startDate) })), (bodyData.endDate && { endDate: new Date(bodyData.endDate) })), (bodyData.availableDays && {
        availableDays: Array.isArray(bodyData.availableDays)
            ? bodyData.availableDays
            : [bodyData.availableDays],
    })), (bodyData.grossValue && { grossValue: Number(bodyData.grossValue) }));
    // ✅ Fix Image URL Format (same as create)
    if (req.files && req.files.image && req.files.image[0]) {
        const file = req.files.image[0];
        const fileName = file.filename;
        payload.image = `/images/${fileName}`;
    }
    const result = yield promotionMercent_service_1.PromotionService.updatePromotionToDB(req.params.id, payload);
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion updated successfully",
        data: result,
    });
}));
const deletePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.deletePromotionFromDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion deleted successfully",
        data: result,
    });
}));
const togglePromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.togglePromotionInDB(req.params.id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promotion not found");
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: `Promotion toggled successfully`,
        data: result,
    });
}));
const getPopularMerchants = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield promotionMercent_service_1.PromotionService.getPopularMerchantsFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Popular merchants fetched successfully",
        data: result,
    });
}));
const getDetailsOfMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // logged-in user id, optional
    const result = yield promotionMercent_service_1.PromotionService.getDetailsOfMerchant(req.params.id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchants details fetched successfully",
        data: result,
    });
}));
const getUserTierOfMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield promotionMercent_service_1.PromotionService.getUserTierOfMerchant(user._id, req.body.merchantId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User Tier of Merchant fetched successfully",
        data: result,
    });
}));
//catagory show pro
const getPromotionsByUserCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { categoryName } = req.query;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // logged-in user
    const promotions = yield promotionMercent_service_1.PromotionService.getPromotionsByUserCategory(String(categoryName), userId);
    res.status(200).json({
        success: true,
        message: "Promotions fetched successfully",
        data: promotions,
    });
}));
const sendNotificationToCustomer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let attachment;
    if (req.files && "image" in req.files && req.files.image[0]) {
        attachment = `/images/${req.files.image[0].filename}`;
    }
    const data = Object.assign(Object.assign({}, req.body), { attachment });
    const merchant = req.user;
    const result = yield promotionMercent_service_1.PromotionService.sendNotificationToCustomer(data, merchant._id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion Notification sent successfully",
        data: result,
    });
}));
// const getCombinePromotionsForUser = catchAsync(async (req: Request, res: Response) => {
//   const userId = (req.user as any)?._id;
//   if (!userId) throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID not found");
//   // 1️⃣ Get user segment
//   const userSegment = await PromotionService.getUserSegment(userId);
//   // 2️⃣ Today and day mapping
//   const today = new Date();
//   const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
//   const todayDay = dayMap[today.getDay()];
//   // 3️⃣ Fetch Merchant Promotions
//   let merchantPromotions = await Promotion.find({
//     customerSegment: { $in: [userSegment, "all_customer"] },
//     status: "active",
//   }).lean();
//   merchantPromotions = merchantPromotions.map(p => ({ ...p, source: "merchant" }));
//   console.log("🔹 Merchant promotions fetched:", merchantPromotions.length);
//   // 4️⃣ Fetch Admin Promotions
//   let adminPromotions = await PromotionAdmin.find({
//     customerSegment: { $in: [userSegment, "all_customer"] },
//     status: "active",
//   }).lean();
//   adminPromotions = adminPromotions.map(p => ({ ...p, source: "admin" }));
//   console.log("🔹 Admin promotions fetched:", adminPromotions.length);
//   // 5️⃣ Deduplicate admin promotions that exist in merchant promotions
//   const merchantIds = new Set(merchantPromotions.map(p => p._id.toString()));
//   adminPromotions = adminPromotions.filter(p => !merchantIds.has(p._id.toString()));
//   console.log("🔹 Admin promotions after dedup:", adminPromotions.length);
//   // 6️⃣ Combine both arrays
//   let promotions = [...merchantPromotions, ...adminPromotions];
//   console.log("🔹 Total combined promotions before filter:", promotions.length);
//   // 7️⃣ Filter by date, day, and already claimed cards
//   const digitalCards = await DigitalCard.find({ userId }).select("promotions");
//   const existingPromotionIds = digitalCards.flatMap(card =>
//     card.promotions.map(p => p.promotionId?.toString()).filter(Boolean)
//   );
//   promotions = promotions.filter(promo => {
//     const startDate = new Date(promo.startDate);
//     const endDate = new Date(promo.endDate);
//     const isValidDate = today >= startDate && today <= endDate;
//     const days = promo.availableDays || [];
//     const isValidDay = days.includes("all") || days.includes(todayDay);
//     const isNotInUserCard = !existingPromotionIds.includes(promo._id.toString());
//     return isValidDate && isValidDay && isNotInUserCard;
//   });
//   console.log("🔹 Promotions after date/day/userCard filter:", promotions.length);
//   // 8️⃣ Attach rating info
//   const promotionIds = promotions.map(p => p._id);
//   const ratingsAgg = await Rating.aggregate([
//     { $match: { promotionId: { $in: promotionIds } } },
//     { $group: { _id: "$promotionId", averageRating: { $avg: "$rating" }, totalRatings: { $sum: 1 } } },
//   ]);
//   const ratingMap = new Map(
//     ratingsAgg.map(r => [
//       r._id.toString(),
//       { averageRating: Number(r.averageRating.toFixed(1)), totalRatings: r.totalRatings },
//     ])
//   );
//   promotions = promotions.map(promo => {
//     const ratingData = ratingMap.get(promo._id.toString());
//     return {
//       ...promo,
//       averageRating: ratingData?.averageRating || 0,
//       totalRatings: ratingData?.totalRatings || 0,
//     };
//   });
//   // 9️⃣ Sort by createdAt descending
//   promotions.sort((a, b) =>
//     new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime()
//   );
//   console.log("🔹 Promotions after sorting:", promotions.map(p => ({ id: p._id, source: (p as any).source })));
//   // 10️⃣ Send response
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Promotions retrieved successfully for user",
//     data: promotions,
//   });
// });
const getCombinePromotionsForUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User ID not found");
    const today = new Date();
    const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const todayDay = dayMap[today.getDay()];
    // 1️⃣ Fetch all active merchant promotions
    const allMerchantPromotions = yield promotionMercent_model_1.Promotion.find({ status: "active" }).lean();
    console.log(`\n🔹 Total merchant promotions in DB: ${allMerchantPromotions.length}`);
    allMerchantPromotions.forEach(p => {
        console.log(`Promotion "${p.name}" | Merchant: ${p.merchantId} | Promo Segment: ${p.customerSegment}`);
    });
    // 2️⃣ Bulk fetch MerchantCustomer segments
    const merchantIds = Array.from(new Set(allMerchantPromotions.map(p => p.merchantId)));
    const customerRecords = yield merchantCustomer_model_1.MerchantCustomer.find({
        merchantId: { $in: merchantIds },
        customerId: userId,
    }).select("merchantId segment");
    const merchantSegmentMap = new Map(customerRecords.map(c => [c.merchantId.toString(), c.segment]));
    // 3️⃣ Merchant-wise segment filtering
    const merchantPromotions = [];
    for (const promo of allMerchantPromotions) {
        const userSegment = merchantSegmentMap.get(promo.merchantId.toString()) || "new_customer";
        console.log(`Checking promotion "${promo.name}" | Merchant: ${promo.merchantId} | ` +
            `Promo Segment: ${promo.customerSegment} | User Segment: ${userSegment}`);
        if (promo.customerSegment === "all_customer" || promo.customerSegment === userSegment) {
            merchantPromotions.push(Object.assign(Object.assign({}, promo), { source: "merchant", userSegment }));
            console.log(`➡ Will be shown to user ✅`);
        }
        else {
            console.log(`➡ Will NOT be shown to user ❌`);
        }
    }
    console.log("🔹 Merchant promotions after segment filter:", merchantPromotions.length);
    // 4️⃣ Fetch all active admin promotions
    let adminPromotions = yield promotionMercent_model_2.PromotionAdmin.find({ status: "active" }).lean();
    adminPromotions = adminPromotions.map(p => (Object.assign(Object.assign({}, p), { source: "admin" })));
    console.log("🔹 Admin promotions fetched:", adminPromotions.length);
    // 5️⃣ Deduplicate admin promotions
    const merchantPromoIds = new Set(merchantPromotions.map(p => p._id.toString()));
    adminPromotions = adminPromotions.filter(p => !merchantPromoIds.has(p._id.toString()));
    console.log("🔹 Admin promotions after dedup:", adminPromotions.length);
    // 6️⃣ Combine merchant + admin promotions
    let promotions = [...merchantPromotions, ...adminPromotions];
    console.log("🔹 Total combined promotions before date/day/userCard filter:", promotions.length);
    // 7️⃣ Filter by date/day/userCard
    const digitalCards = yield digitalCard_model_1.DigitalCard.find({ userId }).select("promotions");
    const existingPromotionIds = new Set(digitalCards.flatMap(card => card.promotions.map(p => { var _a, _b; return (_b = (((_a = p.promotionId) === null || _a === void 0 ? void 0 : _a._id) || p.promotionId)) === null || _b === void 0 ? void 0 : _b.toString(); })));
    promotions = promotions.filter(promo => {
        const isAllCustomer = promo.customerSegment === "all_customer";
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);
        const days = promo.availableDays || [];
        const isValidDate = today >= startDate && today <= endDate;
        const isValidDay = days.includes("all") || days.includes(todayDay);
        const isNotInUserCard = !existingPromotionIds.has(promo._id.toString());
        console.log(`Filtering promo "${promo.name}" | Segment: ${promo.customerSegment} | ` +
            `Start: ${promo.startDate} End: ${promo.endDate} | Days: ${days.join(",")} | ` +
            `isValidDate: ${isValidDate} | isValidDay: ${isValidDay} | NotInUserCard: ${isNotInUserCard}`);
        return isValidDate && isValidDay && isNotInUserCard;
    });
    console.log("🔹 Promotions after date/day/userCard filter:", promotions.length);
    // 8️⃣ Log final promotions
    promotions.forEach(p => {
        console.log(`✅ Final Promotion "${p.name}" | Merchant: ${p.merchantId} | Promo Segment: ${p.customerSegment} | User Segment: ${p.userSegment || 'N/A'}`);
    });
    // 9️⃣ Attach rating info
    const promotionIds = promotions.map(p => p._id);
    const ratingsAgg = yield rating_model_1.Rating.aggregate([
        { $match: { promotionId: { $in: promotionIds } } },
        {
            $group: {
                _id: "$promotionId",
                averageRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 }
            }
        }
    ]);
    const ratingMap = new Map(ratingsAgg.map(r => [
        r._id.toString(),
        { averageRating: Number(r.averageRating.toFixed(1)), totalRatings: r.totalRatings }
    ]));
    promotions = promotions.map(promo => {
        const ratingData = ratingMap.get(promo._id.toString());
        return Object.assign(Object.assign({}, promo), { averageRating: (ratingData === null || ratingData === void 0 ? void 0 : ratingData.averageRating) || 0, totalRatings: (ratingData === null || ratingData === void 0 ? void 0 : ratingData.totalRatings) || 0 });
    });
    // 🔟 Sort by createdAt descending
    promotions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log("🔹 Total promotions sent to user:", promotions.length);
    // 1️⃣1️⃣ Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotions retrieved successfully for user",
        data: promotions,
    });
}));
exports.PromotionController = {
    createPromotion,
    getAllPromotions,
    getSinglePromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion,
    getPopularMerchants,
    getDetailsOfMerchant,
    getUserTierOfMerchant,
    getPromotionsByUserCategory,
    // getPromotionsForUser,
    getCombinePromotionsForUser,
    getAllPromotionsOfAMerchant,
    sendNotificationToCustomer
};
