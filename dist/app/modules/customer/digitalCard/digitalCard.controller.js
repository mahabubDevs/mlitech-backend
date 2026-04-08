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
exports.DigitalCardController = void 0;
const http_status_codes_1 = require("http-status-codes");
const digitalCard_service_1 = require("./digitalCard.service");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
// const addPromotion = catchAsync(async (req, res) => {
//   if (!req.user) {
//     return sendResponse(res, {
//       statusCode: StatusCodes.UNAUTHORIZED,
//       success: false,
//       message: "User not authenticated",
//     });
//   }
//   const user = req.user as IUser;
//   const userId = (user._id as Types.ObjectId).toString();
//   const { promotionId } = req.body;
//   const result = await DigitalCardService.addPromotionToDigitalCard(
//     userId,
//     promotionId
//   );
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Promotion added to digital card successfully",
//     data: result,
//   });
// });
const addPromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "User not authenticated",
        });
    }
    const user = req.user;
    const userId = user._id.toString();
    const { promotionId } = req.body;
    const result = yield digitalCard_service_1.DigitalCardService.addPromotionToDigitalCard(userId, promotionId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Promotion added to digital card successfully",
        data: result,
    });
}));
const getUserAddedPromotions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "User not authenticated",
        });
    }
    const user = req.user;
    const userId = user._id.toString();
    const result = yield digitalCard_service_1.DigitalCardService.getUserAddedPromotions(userId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User promotions retrieved successfully",
        data: result.data,
        pagination: result.pagination,
    });
}));
const getUserDigitalCards = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "User not authenticated",
        });
    }
    const user = req.user;
    // Safely extract _id
    const userId = user._id.toString();
    const result = yield digitalCard_service_1.DigitalCardService.getUserDigitalCards(userId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User digital cards retrieved successfully",
        data: result.data,
        pagination: result.pagination,
    });
}));
const getDigitalCardPromotions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { digitalCardId } = req.params;
    const result = yield digitalCard_service_1.DigitalCardService.getPromotionsOfDigitalCard(digitalCardId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Digital card promotions retrieved successfully",
        data: result,
    });
}));
const getMerchantDigitalCard = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cardCode } = req.query;
    // 🔐 Auth check
    if (!req.user) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "User not authenticated",
        });
    }
    const user = req.user;
    // 🛑 Role check (Merchant OR Sub-Merchant allowed)
    if (user.role !== "MERCENT" && !user.isSubMerchant) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
            success: false,
            message: "Only merchant or merchant staff can access this",
        });
    }
    // ✅ APPLY REQUESTED LOGIC
    const filterId = user.isSubMerchant
        ? user.merchantId
        : user._id;
    if (!filterId) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "Merchant ID not found",
        });
    }
    // 🧪 cardCode validation
    if (!cardCode || typeof cardCode !== "string") {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "Card code or promotion code is required",
        });
    }
    // 🔍 Search digital card (cardCode OR promotionCode)
    const digitalCard = yield digitalCard_service_1.DigitalCardService.getMerchantDigitalCardWithPromotions(filterId.toString(), cardCode);
    if (!digitalCard) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: "No Digital Card for this customer found",
        });
    }
    // ✅ Success response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Digital Card with promotions retrieved successfully",
        data: digitalCard,
    });
}));
// // Type-safe request body
// interface ApprovePromotionBody {
//   digitalCardId: string;
//   promotionId: string;
//   approve: boolean;
// }
// const approvePromotion = catchAsync(
//   async (req, res) => {
//     const { digitalCardId, promotionId, approve } = req.body;
//     // Type cast req.user as IUser
//     const user = req.user as IUser;
//     if (!user || !user._id) {
//       return sendResponse(res, {
//         statusCode: StatusCodes.UNAUTHORIZED,
//         success: false,
//         message: "User not authenticated",
//       });
//     }
//     const digitalCard = await DigitalCard.findOne({
//       _id: digitalCardId,
//       userId: user._id,
//     });
//     if (!digitalCard) throw new Error("Digital Card not found");
//     // Find the promotion in the array
//     const promo = digitalCard.promotions.find(
//       (p) => p.promotionId?.toString() === promotionId
//     );
//     if (!promo) throw new Error("Promotion not found");
//     // Update approval
//     promo.approvedByUser = approve;
//     await digitalCard.save();
//     return sendResponse(res, {
//       statusCode: StatusCodes.OK,
//       success: true,
//       message: approve ? "Promotion approved" : "Promotion declined",
//       data: { digitalCardId, promotionId, approved: approve },
//     });
//   }
// );
const createOrGetUserDigitalCard = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "User not authenticated",
        });
    }
    const user = req.user; // auth থেকে user info
    const userId = user._id.toString();
    const { merchantId } = req.body;
    if (!merchantId) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "merchantId is required",
        });
    }
    // Service call → check & create if not exist
    const digitalCard = yield digitalCard_service_1.DigitalCardService.createOrGetDigitalCard(userId, merchantId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Digital card fetched/created successfully",
        data: {
            cardId: digitalCard._id,
            cardCode: digitalCard.cardCode,
            promotions: digitalCard.promotions,
            merchantId: digitalCard.merchantId,
            userId: digitalCard.userId,
        },
    });
}));
exports.DigitalCardController = {
    addPromotion,
    getUserAddedPromotions,
    getUserDigitalCards,
    getDigitalCardPromotions,
    getMerchantDigitalCard,
    createOrGetUserDigitalCard,
    //   approvePromotion
};
