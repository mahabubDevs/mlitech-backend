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
exports.ReferralService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const referral_model_1 = __importDefault(require("./referral.model"));
const user_model_1 = require("../user/user.model");
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const getMyReferredUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // ✅ Mark referral page as viewed
    yield user_model_1.User.updateOne({ _id: userId, hasViewedReferral: false }, { $set: { hasViewedReferral: true } });
    // 1. Get current user's location
    const currentUser = yield user_model_1.User.findById(userId).select("location referenceId points");
    if (!currentUser)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User not found");
    const currentLocation = (_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser.location) === null || _a === void 0 ? void 0 : _a.coordinates;
    // 2. Aggregate referred users with points & distance
    const referrals = yield referral_model_1.default.aggregate([
        { $match: { referrer: new mongoose_1.default.Types.ObjectId(userId) } },
        // Lookup referred user details
        {
            $lookup: {
                from: "users",
                localField: "referredUser",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        // Sum points earned from this referral
        {
            $lookup: {
                from: "pointtransactions",
                let: { referralId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$referral", "$$referralId"] },
                                    { $eq: ["$type", "EARN"] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalPoints: { $sum: "$points" }
                        }
                    }
                ],
                as: "points"
            }
        },
        {
            $addFields: {
                pointsEarned: { $ifNull: [{ $arrayElemAt: ["$points.totalPoints", 0] }, 0] },
            },
        },
        // Calculate distance if current user has location
        {
            $addFields: {
                distance: currentLocation
                    ? {
                        $let: {
                            vars: { coords: "$user.location.coordinates" },
                            in: {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $acos: {
                                                    $add: [
                                                        {
                                                            $multiply: [
                                                                { $sin: { $degreesToRadians: { $arrayElemAt: ["$$coords", 1] } } },
                                                                { $sin: { $degreesToRadians: currentLocation[1] } },
                                                            ],
                                                        },
                                                        {
                                                            $multiply: [
                                                                { $cos: { $degreesToRadians: { $arrayElemAt: ["$$coords", 1] } } },
                                                                { $cos: { $degreesToRadians: currentLocation[1] } },
                                                                {
                                                                    $cos: {
                                                                        $subtract: [
                                                                            { $degreesToRadians: { $arrayElemAt: ["$$coords", 0] } },
                                                                            { $degreesToRadians: currentLocation[0] },
                                                                        ],
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            },
                                            6371,
                                        ],
                                    },
                                    2,
                                ],
                            },
                        },
                    }
                    : null,
            },
        },
        // Project only required fields
        {
            $project: {
                _id: 1,
                pointsEarned: 1,
                distance: 1,
                "user._id": 1,
                "user.firstName": 1,
                "user.lastName": 1,
                "user.profile": 1,
                "user.address": 1,
                "user.status": 1,
            },
        },
    ]);
    // 3. Totals
    const totalReferrals = referrals.length;
    const totalPoints = currentUser.points;
    const totalJoin = referrals.filter(r => r.user).length;
    const myReferenceId = currentUser.referenceId;
    return { referrals, totalReferrals, totalPoints, totalJoin, myReferenceId };
});
const verifyReferral = (referralId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const referredUser = yield user_model_1.User.findOne({ referenceId: referralId });
    if (!referredUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Referred Id Invalid!");
    }
    return {
        referredUserName: `${referredUser.firstName} ${(_a = referredUser.lastName) !== null && _a !== void 0 ? _a : ""}`.trim(),
    };
});
exports.ReferralService = { getMyReferredUser, verifyReferral };
