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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_service_1 = require("./user.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const subscription_model_1 = require("../subscription/subscription.model");
const digitalCard_model_1 = require("../customer/digitalCard/digitalCard.model");
// register user
const createUser = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = Object.assign({}, req.body);
    const result = yield user_service_1.UserService.createUserToDB(userData);
    console.log("Created User:", result);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Enter the verification code sent to your phone. please verify your phone ${result.phone}`,
    });
}));
// register admin
const createAdmin = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = __rest(req.body, []);
    const result = yield user_service_1.UserService.createAdminToDB(userData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Admin created successfully",
        data: result,
    });
}));
// retrieved user profile
const getUserProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not logged in");
    }
    const result = yield user_service_1.UserService.getUserProfileFromDB(user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Profile data retrieved successfully",
        data: result,
    });
}));
//update profile
const updateProfile = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    let bodyData = req.body;
    // 🔹 যদি body JSON string হয়ে আসে, তাহলে parse করো
    if (typeof req.body.data === "string") {
        bodyData = JSON.parse(req.body.data);
    }
    if (bodyData.phone) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: 400,
            message: "Phone number cannot be changed",
        });
    }
    let profile;
    if (req.files && "profile" in req.files && req.files.profile[0]) {
        profile = `/images/${req.files.profile[0].filename}`;
    }
    let photo;
    if (req.files && "coverPhoto" in req.files && req.files.coverPhoto[0]) {
        photo = `/images/${req.files.coverPhoto[0].filename}`;
    }
    if ((bodyData === null || bodyData === void 0 ? void 0 : bodyData.latitude) && (bodyData === null || bodyData === void 0 ? void 0 : bodyData.longitude)) {
        bodyData.location = {
            type: "Point",
            coordinates: [Number(bodyData.longitude), Number(bodyData.latitude)],
        };
        delete bodyData.latitude;
        delete bodyData.longitude;
    }
    /** 🔔 Notification settings safe update */
    const notificationUpdate = {};
    if (bodyData.notificationSettings) {
        // Loop through notificationSettings
        for (const [key, value] of Object.entries(bodyData.notificationSettings)) {
            // value যদি string "true"/"false" হয়, তাহলে boolean-এ convert করো
            if (typeof value === "string") {
                notificationUpdate[`notificationSettings.${key}`] = value.toLowerCase() === "true";
            }
            else {
                // যদি boolean হয়ে আসে, 그대로 assign করো
                notificationUpdate[`notificationSettings.${key}`] = value;
            }
        }
        // মূল bodyData থেকে notificationSettings remove করো
        delete bodyData.notificationSettings;
    }
    const data = Object.assign(Object.assign({ profile,
        photo }, bodyData), notificationUpdate);
    // console.log("data", data);
    const result = yield user_service_1.UserService.updateProfileToDB(user, data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Profile updated successfully",
        data: result,
    });
}));
const getUserOnlineStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const result = yield user_service_1.UserService.getUserOnlineStatusFromDB(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User online status fetched successfully",
        data: result,
    });
}));
const getUserSummaryCounts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "User not logged in",
        });
    }
    // 1️⃣ Fetch subscriptions with package title
    const subscriptions = yield subscription_model_1.Subscription.find({ user: userId })
        .populate("package", "title") // fetch only package title
        .lean();
    // Extract only titles
    const subscriptionTitles = subscriptions.map(sub => { var _a; return (_a = sub.package) === null || _a === void 0 ? void 0 : _a.title; }).filter(Boolean);
    // 2️⃣ Total spent
    const totalSpent = subscriptions.reduce((sum, sub) => sum + sub.price, 0);
    // 3️⃣ Total digital cards
    const totalDigitalCards = yield digitalCard_model_1.DigitalCard.countDocuments({ userId });
    // 4️⃣ Total promotions
    const digitalCards = yield digitalCard_model_1.DigitalCard.find({ userId }).select("promotions").lean();
    const totalPromotions = digitalCards.reduce((sum, card) => {
        const available = (card.promotions || []).filter((p) => p.status !== "used").length;
        return sum + available;
    }, 0);
    // 5️⃣ Minimal response
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "User Summary fetched successfully",
        data: {
            totalSpent,
            totalDigitalCards,
            totalPromotions,
            subscriptionTitles,
        },
    });
}));
exports.UserController = {
    createUser,
    createAdmin,
    getUserProfile,
    updateProfile,
    getUserOnlineStatus,
    getUserSummaryCounts
};
