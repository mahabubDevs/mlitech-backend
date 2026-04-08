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
exports.PushController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const push_service_1 = require("./push.service");
const http_status_codes_1 = require("http-status-codes");
const sendNotificationToAll = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Request Body:", req.body);
    const result = yield push_service_1.PushService.sendNotificationToAllUsers(req.body, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Notification sent successfully",
        data: result,
    });
}));
const sendMerchantPromotion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const merchant = req.user;
    const merchantId = merchant._id;
    console.log("📌 Merchant ID:", merchantId);
    console.log("📌 Request Body raw:", req.body);
    console.log("📌 Uploaded Files:", req.files);
    // 🔹 Base URL
    // const baseUrl = `${req.protocol}://${req.get("host")}`;
    const baseUrl = "https://hz2w208g-5004.inc1.devtunnels.ms";
    console.log("🌐 Base URL:", baseUrl);
    // Parse JSON data
    const payloadData = req.body.data ? JSON.parse(req.body.data) : {};
    console.log("📝 Parsed payloadData:", payloadData);
    // Image: uploaded file overrides body link
    const image = req.files && req.files.image
        ? `${baseUrl}/images/${req.files.image[0].filename}`
        : (_a = payloadData.image) === null || _a === void 0 ? void 0 : _a.replace(/^\/uploads/, "");
    console.log("🖼 Image URL to send:", image);
    // FRONTEND LAT/LNG
    let merchantLocation = null;
    if (payloadData.lat !== undefined && payloadData.lng !== undefined) {
        merchantLocation = {
            type: "Point",
            coordinates: [Number(payloadData.lng), Number(payloadData.lat)],
        };
        console.log("📍 Merchant Location:", merchantLocation);
    }
    const payload = {
        title: payloadData.title || "Promotion",
        message: payloadData.message,
        image,
        target: { type: "points" },
        filters: {
            minPoints: payloadData.minPoints ? Number(payloadData.minPoints) : 0,
            segment: (_b = payloadData.segment) !== null && _b !== void 0 ? _b : "all_customer",
            radius: payloadData.radius ? Number(payloadData.radius) : Infinity,
            merchantLocation,
        },
        state: payloadData.state,
        country: payloadData.country,
        city: payloadData.city,
        tier: payloadData.tier,
        subscriptionType: payloadData.subscriptionType,
    };
    console.log("📌 Final Payload for PushService:", payload);
    const result = yield push_service_1.PushService.sendMerchantPromotion(payload, merchantId);
    console.log("✅ Notification Result:", result);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Promotion notification sent successfully",
        data: result,
    });
}));
// const getAllPushes = catchAsync(async (req: Request, res: Response) => {
//   const result = await PushService.getAllPushesFromDB(req.query);
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Push notifications fetched successfully",
//     data: result.data,
//     pagination: result.pagination,
//   });
// });
exports.PushController = {
    sendNotificationToAll,
    sendMerchantPromotion
    //  getAllPushes 
};
