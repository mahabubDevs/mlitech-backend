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
exports.AdminService = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enums/user");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const notificationsHelper_1 = require("../../../helpers/notificationsHelper");
const notification_model_1 = require("../notification/notification.model");
const exceljs_1 = __importDefault(require("exceljs"));
const mongoose_1 = require("mongoose");
const favorite_model_1 = require("../customer/favorite/favorite.model");
const rating_model_1 = require("../customer/rating/rating.model");
const sendPushNotification_1 = require("../../../helpers/sendPushNotification");
const subscription_model_1 = require("../subscription/subscription.model");
const mercentSellManagement_model_1 = require("../mercent/mercentSellManagement/mercentSellManagement.model");
const digitalCard_model_1 = require("../customer/digitalCard/digitalCard.model");
const createAdminToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const createAdmin = yield user_model_1.User.create(payload);
    if (!createAdmin) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to create Admin");
    }
    if (createAdmin) {
        yield user_model_1.User.findByIdAndUpdate({ _id: createAdmin === null || createAdmin === void 0 ? void 0 : createAdmin._id }, { verified: true }, { new: true });
    }
    return createAdmin;
});
const deleteAdminFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistAdmin = yield user_model_1.User.findByIdAndDelete(id);
    if (!isExistAdmin) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to delete Admin");
    }
    return;
});
const getAdminFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const admins = yield user_model_1.User.find({ role: "ADMIN" }).select("name email profile contact location");
    return admins;
});
const updateUserStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedUser = yield user_model_1.User.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), {
        status,
        lastStatusChanged: new Date(),
    }, {
        new: true,
        runValidators: true,
    });
    if (!updatedUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return updatedUser;
});
// const getAllCustomers = async (query: Record<string, unknown>) => {
//   console.log("📥 Query:", query);
//   // 1️⃣ Fetch base users
//   const baseQuery = User.find({ role: "USER" }).select(
//     "customUserId firstName lastName phone email status address referredInfo.referredBy subscription"
//   );
//   const allCustomersQuery = new QueryBuilder(baseQuery, query)
//     .search(["firstName", "lastName", "email", "phone", "customUserId", "address"])
//     .filter()
//     .paginate()
//     .sort();
//   const [allcustomers, pagination] = await Promise.all([
//     allCustomersQuery.modelQuery.lean<any[]>(),
//     allCustomersQuery.getPaginationInfo(),
//   ]);
//   console.log("👥 Total Customers:", allcustomers.length);
//   const userIds = allcustomers.map((u: any) => u._id.toString());
//   console.log("🆔 User IDs:", userIds);
//   // 2️⃣ Fetch latest subscriptions per user
//   const subscriptions = await Subscription.find({
//     user: { $in: userIds },
//   })
//     .sort({ currentPeriodEnd: -1 })
//     .lean();
//   const subscriptionMap: Record<string, any> = {};
//   subscriptions.forEach((sub) => {
//     const userId = sub.user.toString();
//     if (!subscriptionMap[userId]) subscriptionMap[userId] = sub;
//   });
//   // 3️⃣ Fetch total points per user from DigitalCard
//   const digitalCards = await DigitalCard.find({ userId: { $in: userIds } }).lean();
//   const pointsMap: Record<string, number> = {};
//   digitalCards.forEach((card) => {
//     const userId = card.userId.toString();
//     pointsMap[userId] = (pointsMap[userId] || 0) + (card.lifeTimeEarnPoints || 0);
//   });
//   // 4️⃣ Fetch total sell amount per user
//   const sells = await Sell.find({ userId: { $in: userIds }, status: "completed" }).lean();
//   const sellMap: Record<string, number> = {};
//   sells.forEach((sell) => {
//     if (sell.userId) {
//       const userId = sell.userId.toString();
//       sellMap[userId] = (sellMap[userId] || 0) + (Number(sell.totalBill) || 0);
//     }
//   });
//   const now = new Date();
//   // 5️⃣ Merge subscription, points, and total sell into user
//   const customersWithData = allcustomers.map((user) => {
//     const subData = subscriptionMap[user._id.toString()] || null;
//     const isActive =
//       subData &&
//       subData.status === "active" &&
//       new Date(subData.currentPeriodEnd) > now;
//     return {
//       ...user,
//       subscriptionData: subData
//         ? {
//             currentPeriodStart: subData.currentPeriodStart,
//             currentPeriodEnd: subData.currentPeriodEnd,
//             status: subData.status,
//             price: subData.price,
//             package: subData.package,
//           }
//         : null,
//       subscription: isActive ? "active" : "inActive",
//       totalPoints: pointsMap[user._id.toString()] || 0,
//       totalSellAmount: sellMap[user._id.toString()] || 0,
//     };
//   });
//   console.log(
//     "🎯 Final Customers with Points & Sell:",
//     JSON.stringify(customersWithData, null, 2)
//   );
//   return {
//     allcustomers: customersWithData,
//     pagination,
//   };
// };
const getAllCustomers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("📥 Query:", query);
    // 1️⃣ Fetch base users (same as your getAllCustomers)
    const baseQuery = user_model_1.User.find({ role: "USER" }).select("customUserId firstName lastName phone email status address referredInfo.referredBy subscription");
    const allCustomersQuery = new queryBuilder_1.default(baseQuery, query)
        .search(["firstName", "lastName", "email", "phone", "customUserId", "address"])
        .filter()
        .paginate()
        .sort();
    const [allcustomers, pagination] = yield Promise.all([
        allCustomersQuery.modelQuery.lean(),
        allCustomersQuery.getPaginationInfo(),
    ]);
    const userIds = allcustomers.map((u) => u._id.toString());
    // 2️⃣ Subscriptions
    const subscriptions = yield subscription_model_1.Subscription.find({
        user: { $in: userIds },
    }).populate("package", "title price").lean()
        .sort({ currentPeriodEnd: -1 })
        .lean();
    const subscriptionMap = {};
    subscriptions.forEach((sub) => {
        const userId = sub.user.toString();
        if (!subscriptionMap[userId])
            subscriptionMap[userId] = sub;
    });
    // 3️⃣ Points
    const digitalCards = yield digitalCard_model_1.DigitalCard.find({ userId: { $in: userIds } }).lean();
    const pointsMap = {};
    digitalCards.forEach((card) => {
        const userId = card.userId.toString();
        pointsMap[userId] = (pointsMap[userId] || 0) + (card.availablePoints || 0);
    });
    const now = new Date();
    // 4️⃣ Combine sells per user (paginated per customer)
    const customersWithData = yield Promise.all(allcustomers.map((user) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const subData = subscriptionMap[user._id.toString()] || null;
        const isActive = subData &&
            subData.status === "active" &&
            new Date(subData.currentPeriodEnd) > now;
        // Fetch sells per customer
        const sellResult = yield getCustomerSellDetails(user._id.toString(), query);
        return Object.assign(Object.assign({}, user), { subscriptionData: subData
                ? {
                    currentPeriodStart: subData.currentPeriodStart,
                    currentPeriodEnd: subData.currentPeriodEnd,
                    status: subData.status,
                    price: subData.price,
                    package: ((_a = subData.package) === null || _a === void 0 ? void 0 : _a.title) || "",
                }
                : null, subscription: isActive ? "active" : "inActive", totalPoints: pointsMap[user._id.toString()] || 0, totalSellAmount: sellResult.data.reduce((sum, s) => sum + (s.totalBill || 0), 0), sells: sellResult.data, sellsPagination: sellResult.pagination });
    })));
    return {
        allcustomers: customersWithData,
        pagination, // customer pagination
    };
});
// const getAllMerchants = async (query: Record<string, unknown>, user: any) => {
//   const { address, service, radius, favorite, ...rest } = query;
//   const userId = user?._id;
//   // 1️⃣ Database থেকে user location fetch
//   const userData = await User.findById(userId).select("location").lean();
//   const userLocation = userData?.location;
//   // 2️⃣ Base query
//   let baseQuery = User.find({ role: USER_ROLES.MERCENT, verified: true });
//   const allMerchantsQuery = new QueryBuilder(baseQuery, rest)
//     .search([
//       "firstName",
//       "lastName",
//       "email",
//       "phone",
//       "businessName",
//       "service",
//       "address",
//       "customUserId",
//       "location",
//       "country",
//       "city",
//     ])
//     .filter()
//     .sort()
//     .paginate();
//   // 3️⃣ Address filter
//   if (address) {
//     allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
//       address: { $regex: address as string, $options: "i" },
//     });
//   }
//   // 4️⃣ Service filter
//   if (service) {
//     const serviceWords = (service as string).split(/\s+|,/);
//     allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
//       $or: serviceWords.map((word) => ({
//         service: { $regex: word, $options: "i" },
//       })),
//     });
//   }
//   // 5️⃣ Radius filter
//   if (userLocation && radius) {
//     allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
//       location: {
//         $geoWithin: {
//           $centerSphere: [userLocation.coordinates, Number(radius) / 6378.1],
//         },
//       },
//     });
//   }
//   // 6️⃣ Fetch merchants, pagination, favorites
//   const [allmerchants, pagination, favorites] = await Promise.all([
//     allMerchantsQuery.modelQuery.lean(),
//     allMerchantsQuery.getPaginationInfo(),
//     Favorite.find({ userId }).select("merchantId").lean(),
//   ]);
//   const favoriteMap = new Set(favorites.map((f) => f.merchantId.toString()));
//   const merchantIds = allmerchants.map((m) => m._id);
//   // 7️⃣ Fetch average rating for each merchant from user ratings
//   const ratingsAgg = await Rating.aggregate([
//     { $match: { merchantId: { $in: merchantIds } } },
//     {
//       $group: {
//         _id: "$merchantId",
//         avgRating: { $avg: "$rating" }, // শুধু ওই merchant কে rating দেওয়া user দের average
//         ratingCount: { $sum: 1 },       // কতজন user rating দিয়েছে
//       },
//     },
//   ]);
//   const ratingMap = new Map<string, { avgRating: number; ratingCount: number }>();
//   ratingsAgg.forEach((r) =>
//     ratingMap.set(r._id.toString(), {
//       avgRating: parseFloat(r.avgRating.toFixed(1)),
//       ratingCount: r.ratingCount,
//     })
//   );
//   // 8️⃣ Fetch total completed sell per merchant
//   const salesAgg = await Sell.aggregate([
//     {
//       $match: {
//         merchantId: { $in: merchantIds },
//         status: "completed",
//       },
//     },
//     {
//       $group: {
//         _id: "$merchantId",
//         totalRevenue: { $sum: "$discountedBill" },
//         totalTransactions: { $sum: 1 },
//       },
//     },
//   ]);
//   const salesMap = new Map<string, { totalRevenue: number; totalTransactions: number }>();
//   salesAgg.forEach((s) =>
//     salesMap.set(s._id.toString(), {
//       totalRevenue: s.totalRevenue,
//       totalTransactions: s.totalTransactions,
//     })
//   );
//   // 9️⃣ Combine all info
//   let merchantsWithFavorite = allmerchants.map((merchant) => {
//     const merchantIdStr = (merchant._id as any).toString();
//     const salesData = salesMap.get(merchantIdStr);
//     const ratingData = ratingMap.get(merchantIdStr);
//     return {
//       ...merchant,
//       isFavorite: favoriteMap.has(merchantIdStr),
//       rating: ratingData?.avgRating || 0,       // user rating average
//       ratingCount: ratingData?.ratingCount || 0, // কতজন user rating দিয়েছে
//       totalRevenue: salesData?.totalRevenue || 0,
//       totalTransactions: salesData?.totalTransactions || 0,
//     };
//   });
//   if (favorite === "true") {
//     merchantsWithFavorite = merchantsWithFavorite.filter((m) => m.isFavorite);
//   }
//   return { allmerchants: merchantsWithFavorite, pagination };
// };
//============merchant export service ============//
const getAllMerchants = (query, user) => __awaiter(void 0, void 0, void 0, function* () {
    const { address, service, radius, favorite, limit = 10, page = 1, customerPage = 1, customerLimit = 5 } = query, rest = __rest(query, ["address", "service", "radius", "favorite", "limit", "page", "customerPage", "customerLimit"]);
    const userId = user === null || user === void 0 ? void 0 : user._id;
    const customerSkip = (Number(customerPage) - 1) * Number(customerLimit);
    // 1️⃣ User location
    const userData = yield user_model_1.User.findById(userId).select("location").lean();
    const userLocation = userData === null || userData === void 0 ? void 0 : userData.location;
    // 2️⃣ Base query for merchants
    let baseQuery = user_model_1.User.find({
        role: user_1.USER_ROLES.MERCENT,
        verified: true,
    });
    // 3️⃣ Filters
    if (address) {
        baseQuery = baseQuery.find({ address: { $regex: address, $options: "i" } });
    }
    if (service) {
        const serviceWords = service.split(/\s+|,/);
        baseQuery = baseQuery.find({
            $or: serviceWords.map((word) => ({ service: { $regex: word, $options: "i" } })),
        });
    }
    if (userLocation && radius) {
        baseQuery = baseQuery.find({
            location: {
                $geoWithin: {
                    $centerSphere: [userLocation.coordinates, Number(radius) / 6378.1],
                },
            },
        });
    }
    // 4️⃣ QueryBuilder for merchant pagination
    const allMerchantsQuery = new queryBuilder_1.default(baseQuery, Object.assign(Object.assign({}, rest), { limit, page }))
        .search([
        "firstName",
        "lastName",
        "email",
        "phone",
        "businessName",
        "service",
        "address",
        "customUserId",
        "country",
        "city",
    ])
        .filter()
        .sort()
        .paginate();
    // 5️⃣ Fetch merchants, pagination, favorites
    const [allmerchants, pagination, favorites] = yield Promise.all([
        allMerchantsQuery.modelQuery.lean(),
        allMerchantsQuery.getPaginationInfo(),
        favorite_model_1.Favorite.find({ userId }).select("merchantId").lean(),
    ]);
    const favoriteMap = new Set(favorites.map((f) => f.merchantId.toString()));
    const merchantIds = allmerchants.map((m) => m._id);
    // 6️⃣ Ratings
    const ratingsAgg = yield rating_model_1.Rating.aggregate([
        { $match: { merchantId: { $in: merchantIds } } },
        { $group: { _id: "$merchantId", avgRating: { $avg: "$rating" }, ratingCount: { $sum: 1 } } },
    ]);
    const ratingMap = new Map();
    ratingsAgg.forEach((r) => ratingMap.set(r._id.toString(), { avgRating: parseFloat(r.avgRating.toFixed(1)), ratingCount: r.ratingCount }));
    // 7️⃣ Sales summary
    const salesAgg = yield mercentSellManagement_model_1.Sell.aggregate([
        { $match: { merchantId: { $in: merchantIds }, status: "completed" } },
        { $group: { _id: "$merchantId", totalRevenue: { $sum: "$discountedBill" }, totalTransactions: { $sum: 1 } } },
    ]);
    const salesMap = new Map();
    salesAgg.forEach((s) => salesMap.set(s._id.toString(), { totalRevenue: s.totalRevenue, totalTransactions: s.totalTransactions }));
    // 8️⃣ Customer-wise stats WITH pagination for each merchant
    const customerStatsAgg = yield mercentSellManagement_model_1.Sell.aggregate([
        { $match: { merchantId: { $in: merchantIds }, status: "completed" } },
        {
            $group: {
                _id: { merchantId: "$merchantId", userId: "$userId" },
                totalSellAmount: { $sum: "$totalBill" },
                totalEarnedPoints: { $sum: "$pointsEarned" },
                totalRedeemedPoints: { $sum: "$pointRedeemed" },
                totalTransactions: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id.userId",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                merchantId: "$_id.merchantId",
                userId: "$_id.userId",
                customUserId: "$user.customUserId",
                name: { $trim: { input: { $concat: [{ $ifNull: ["$user.firstName", ""] }, " ", { $ifNull: ["$user.lastName", ""] }] } } },
                email: "$user.email",
                totalSellAmount: 1,
                totalEarnedPoints: 1,
                totalRedeemedPoints: 1,
                totalTransactions: 1,
            },
        },
        {
            $group: {
                _id: "$merchantId",
                customers: { $push: "$$ROOT" },
                totalCustomers: { $sum: 1 },
            },
        },
    ]);
    const customerStatsMap = new Map();
    customerStatsAgg.forEach((stat) => customerStatsMap.set(stat._id.toString(), { customers: stat.customers, totalCustomers: stat.totalCustomers }));
    // 9️⃣ Merge final data
    let merchantsWithData = allmerchants.map((merchant) => {
        var _a, _b, _c, _d, _e;
        const merchantIdStr = merchant._id.toString();
        const customerData = customerStatsMap.get(merchantIdStr);
        // Apply customer pagination here
        const paginatedCustomers = ((_a = customerData === null || customerData === void 0 ? void 0 : customerData.customers) === null || _a === void 0 ? void 0 : _a.slice(customerSkip, customerSkip + Number(customerLimit))) || [];
        return Object.assign(Object.assign({}, merchant), { isFavorite: favoriteMap.has(merchantIdStr), rating: ((_b = ratingMap.get(merchantIdStr)) === null || _b === void 0 ? void 0 : _b.avgRating) || 0, ratingCount: ((_c = ratingMap.get(merchantIdStr)) === null || _c === void 0 ? void 0 : _c.ratingCount) || 0, totalRevenue: ((_d = salesMap.get(merchantIdStr)) === null || _d === void 0 ? void 0 : _d.totalRevenue) || 0, totalTransactions: ((_e = salesMap.get(merchantIdStr)) === null || _e === void 0 ? void 0 : _e.totalTransactions) || 0, customers: paginatedCustomers, customersPagination: {
                total: (customerData === null || customerData === void 0 ? void 0 : customerData.totalCustomers) || 0,
                page: Number(customerPage),
                limit: Number(customerLimit),
                totalPage: Math.ceil(((customerData === null || customerData === void 0 ? void 0 : customerData.totalCustomers) || 0) / Number(customerLimit)),
            } });
    });
    // 10️⃣ Favorite filter
    if (favorite === "true") {
        merchantsWithData = merchantsWithData.filter((m) => m.isFavorite);
    }
    return { allmerchants: merchantsWithData, pagination };
});
const exportMerchants = (query) => __awaiter(void 0, void 0, void 0, function* () {
    /* ---------------- Base Query ---------------- */
    const baseQuery = user_model_1.User.find({ role: user_1.USER_ROLES.MERCENT }).select("customUserId firstName lastName email phone status address createdAt");
    /* ---------------- Apply Filters ---------------- */
    const merchantsQuery = new queryBuilder_1.default(baseQuery, query)
        .search(["firstName", "lastName", "email", "phone"])
        .filter()
        .sort();
    const merchants = yield merchantsQuery.modelQuery.lean();
    /* ---------------- Excel ---------------- */
    const workbook = new exceljs_1.default.Workbook();
    workbook.creator = "The Pigeon Hub";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Merchants");
    sheet.columns = [
        { header: "Merchant ID", key: "customUserId", width: 20 },
        { header: "First Name", key: "firstName", width: 20 },
        { header: "Last Name", key: "lastName", width: 20 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Status", key: "status", width: 15 },
        { header: "Address", key: "address", width: 35 },
        { header: "Created At", key: "createdAt", width: 22 },
    ];
    merchants.forEach((m) => {
        sheet.addRow(Object.assign(Object.assign({}, m), { createdAt: m.createdAt
                ? new Date(m.createdAt).toLocaleString()
                : "" }));
    });
    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = "A1:H1";
    /* ---------------- Buffer ---------------- */
    const buffer = yield workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
});
// near merchants service
const getNearbyMerchants = (query, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const user = yield user_model_1.User.findById(userId).select("location");
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const lng = (_b = (_a = user.location) === null || _a === void 0 ? void 0 : _a.coordinates) === null || _b === void 0 ? void 0 : _b[0];
    const lat = (_d = (_c = user.location) === null || _c === void 0 ? void 0 : _c.coordinates) === null || _d === void 0 ? void 0 : _d[1];
    if (lng == null || lat == null) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User location not found");
    }
    const radius = query.radius ? Number(query.radius) : 10; // km
    const searchTerm = query.searchTerm ? String(query.searchTerm) : null;
    const radiusInMeters = radius * 1000;
    const pipeline = [
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                distanceField: "distance",
                spherical: true,
                maxDistance: radiusInMeters,
            },
        },
        {
            $match: {
                role: user_1.USER_ROLES.MERCENT,
                status: user_1.USER_STATUS.ACTIVE,
            },
        },
        {
            $project: {
                firstName: 1,
                profile: 1,
                distance: 1,
                address: { $ifNull: ["$address", ""] },
                lng: { $arrayElemAt: ["$location.coordinates", 0] },
                lat: { $arrayElemAt: ["$location.coordinates", 1] },
            },
        },
    ];
    if (searchTerm) {
        pipeline.push({
            $match: {
                firstName: { $regex: searchTerm, $options: "i" },
            },
        });
    }
    pipeline.push({
        $lookup: {
            from: "ratings",
            localField: "_id",
            foreignField: "merchantId",
            as: "ratings",
        },
    }, {
        $addFields: {
            totalRatings: { $size: "$ratings" },
            avgRating: {
                $cond: [
                    { $gt: [{ $size: "$ratings" }, 0] },
                    { $round: [{ $avg: "$ratings.rating" }, 1] },
                    0,
                ],
            },
        },
    }, {
        $addFields: {
            address: {
                $concat: [
                    { $ifNull: ["$address", ""] },
                    " (",
                    {
                        $toString: {
                            $round: [{ $divide: ["$distance", 1000] }, 2],
                        },
                    },
                    " km)"
                ],
            },
        },
    }, { $sort: { distance: 1 } });
    const merchants = yield user_model_1.User.aggregate(pipeline);
    return merchants;
});
// ====== customer crue operations ====== //
//==== single customer details ====//
const getSingleCustomer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ _id: id, role: "USER" }).lean();
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Customer not found");
    }
    return user;
});
//===== update customer ======//
const updateCustomer = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const customer = yield user_model_1.User.findOneAndUpdate({ _id: id, role: "USER" }, payload, { new: true, runValidators: true }).lean();
    if (!customer) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Customer not found");
    }
    return customer;
});
//===== delete customer ======//
const deleteCustomer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOneAndDelete({ _id: id, role: "USER" }).lean();
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Customer not found");
    }
    return user;
});
//===== customer status update ======//
const updateCustomerStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOneAndUpdate({ _id: id, role: "USER" }, { status }, { new: true }).lean();
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Customer not found");
    }
    return user;
});
//================== mercent crue operations ===================//
//=== singel merchant details ===//
const getSingleMerchant = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield user_model_1.User.findById(id).lean();
    if (!merchant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    return merchant;
});
//==== update merchant ====//
const updateMerchant = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield user_model_1.User.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    }).lean();
    if (!merchant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    return merchant;
});
//==== delete merchant ====//
const deleteMerchant = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Delete Merchant called for ID:", id);
    const merchant = yield user_model_1.User.findById(id).lean();
    if (!merchant) {
        console.log("Merchant not found in DB");
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    console.log("Merchant found:", merchant.firstName, merchant.email, merchant.fcmToken);
    // 1️⃣ Send push notification
    if (merchant.fcmToken) {
        console.log("Sending push notification to:", merchant.fcmToken);
        yield (0, sendPushNotification_1.sendPushNotification)(merchant.fcmToken, "Account Deleted", "Your merchant account has been deleted by Admin.");
        console.log("Push notification sent");
    }
    else {
        console.log("No FCM token found, skipping notification");
    }
    // 2️⃣ Save DB Notification for Super Admin(s)
    // 🔎 Find Super Admin(s)
    const superAdmins = yield user_model_1.User.find({
        role: user_1.USER_ROLES.SUPER_ADMIN,
    }).select("_id fcmToken");
    if (!superAdmins.length) {
        console.log("No Super Admin found");
    }
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: superAdmins.map((admin) => admin._id),
        title: `Merchant ${merchant.firstName} (${merchant.email}) has been deleted by Admin.`,
        body: `Merchant ${merchant.firstName} (${merchant.email}) has been deleted by Admin.`,
        type: notification_model_1.NotificationType.MANUAL,
    });
    // 2️⃣ Delete merchant
    const deleted = yield user_model_1.User.findByIdAndDelete(id);
    console.log("Merchant deleted from DB:", deleted === null || deleted === void 0 ? void 0 : deleted._id);
    return merchant;
});
//==== merchant status update ====//
const updateMerchantStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield user_model_1.User.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!merchant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    return merchant;
});
const updateMerchantApproveStatus = (id, approveStatus, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const merchant = yield user_model_1.User.findById(id).lean();
    if (!merchant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Merchant not found");
    }
    if (merchant.approveStatus === approveStatus) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Merchant already has this status");
    }
    let data = {
        approveStatus,
    };
    if (approveStatus === user_1.APPROVE_STATUS.APPROVED) {
        const adminName = yield user_model_1.User.findById(adminId).select("firstName lastName").lean();
        if (!adminName) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Admin not found");
        }
        data.status = user_1.USER_STATUS.ACTIVE;
        data.salesRep = `${adminName.firstName} ${(_a = adminName.lastName) !== null && _a !== void 0 ? _a : ""}`.trim();
    }
    const result = yield user_model_1.User.findByIdAndUpdate(id, data, { new: true }).lean();
    if (approveStatus === user_1.APPROVE_STATUS.APPROVED) {
        if (merchant.fcmToken) {
            console.log("Sending push notification to:", merchant.fcmToken);
            yield (0, sendPushNotification_1.sendPushNotification)(merchant.fcmToken, "Account Approved", "Your merchant account has been approved by Admin.");
            console.log("Push notification sent");
        }
        else {
            console.log("No FCM token found, skipping notification");
        }
        yield (0, notificationsHelper_1.sendNotification)({
            userIds: [merchant._id],
            title: "Congratulations! Your account Approved",
            body: `Welcome ${merchant.firstName}, Your account has been approved successfully`,
            type: notification_model_1.NotificationType.WELCOME,
        });
    }
    const superAdmins = yield user_model_1.User.find({
        role: user_1.USER_ROLES.SUPER_ADMIN,
    }).select("_id fcmToken");
    if (!superAdmins.length) {
        console.log("No Super Admin found");
    }
    yield (0, notificationsHelper_1.sendNotification)({
        userIds: superAdmins.map((admin) => admin._id),
        title: `Merchant ${merchant.firstName} (${merchant.email}) has been approved.`,
        body: `Merchant ${merchant.firstName} (${merchant.email}) has been approved by Admin.`,
        type: notification_model_1.NotificationType.MANUAL,
    });
    return result;
});
const exportCustomers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    /* ---------------- Base Query ---------------- */
    const baseQuery = user_model_1.User.find({ role: "USER" }).select("customUserId firstName lastName email phone status address createdAt");
    /* ---------------- Apply Filters ---------------- */
    const customersQuery = new queryBuilder_1.default(baseQuery, query)
        .search(["firstName", "lastName", "email", "phone"])
        .filter()
        .sort();
    const customers = yield customersQuery.modelQuery.lean();
    /* ---------------- Excel ---------------- */
    const workbook = new exceljs_1.default.Workbook();
    workbook.creator = "The Pigeon Hub";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Customers");
    sheet.columns = [
        { header: "Customer ID", key: "customUserId", width: 20 },
        { header: " Name", key: "firstName", width: 20 },
        // { header: "Last Name", key: "lastName", width: 20 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Status", key: "status", width: 15 },
        { header: "Address", key: "address", width: 35 },
        // { header: "Subscripton", key: "", width: 22 },
        { header: "Created At", key: "createdAt", width: 22 },
    ];
    customers.forEach((c) => {
        sheet.addRow(Object.assign(Object.assign({}, c), { createdAt: new Date(c.createdAt).toLocaleString() }));
    });
    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = "A1:H1";
    /* ---------------- Buffer ---------------- */
    const buffer = yield workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
});
const getCustomerSellDetails = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("📥 UserId:", userId);
    // ===============================
    // 🔥 Base Query
    // ===============================
    const baseQuery = mercentSellManagement_model_1.Sell.find({
        userId,
        status: "completed",
    }).populate("merchantId", "firstName businessName email");
    // ===============================
    // 🔥 Query Builder Apply
    // ===============================
    const sellQuery = new queryBuilder_1.default(baseQuery, query)
        .filter()
        .sort()
        .paginate();
    const [sells, pagination] = yield Promise.all([
        sellQuery.modelQuery.lean(),
        sellQuery.getPaginationInfo(),
    ]);
    console.log("🧾 Total Sells (paginated):", sells.length);
    // ===============================
    // 🔥 Format Data
    // ===============================
    const formattedSells = sells.map((sell) => ({
        sellId: sell._id,
        merchant: sell.merchantId,
        totalBill: sell.totalBill,
        discountedBill: sell.discountedBill,
        pointsEarned: sell.pointsEarned,
        pointRedeemed: sell.pointRedeemed,
        finalPoints: (sell.pointsEarned || 0) - (sell.pointRedeemed || 0),
        status: sell.status,
        date: sell.createdAt,
    }));
    return {
        data: formattedSells,
        pagination,
    };
});
const getMerchantCustomerStats = (merchantId, query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("📥 MerchantId:", merchantId);
    const limit = Number(query.limit) || 10;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;
    // ===============================
    // 🔥 Aggregation Pipeline
    // ===============================
    const pipeline = [
        {
            $match: {
                merchantId: new mongoose_1.Types.ObjectId(merchantId),
                status: "completed",
            },
        },
        {
            $group: {
                _id: "$userId",
                totalSellAmount: { $sum: "$totalBill" },
                totalEarnedPoints: { $sum: "$pointsEarned" },
                totalRedeemedPoints: { $sum: "$pointRedeemed" },
                totalTransactions: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                userId: "$_id",
                customUserId: "$user.customUserId",
                name: {
                    $concat: [
                        { $ifNull: ["$user.firstName", ""] },
                        " ",
                        { $ifNull: ["$user.lastName", ""] }
                    ]
                },
                email: "$user.email",
                totalSellAmount: 1,
                totalEarnedPoints: 1,
                totalRedeemedPoints: 1,
                totalTransactions: 1,
            },
        },
        {
            $sort: { totalSellAmount: -1 }, // top customers first
        },
        { $skip: skip },
        { $limit: limit },
    ];
    const data = yield mercentSellManagement_model_1.Sell.aggregate(pipeline);
    // ===============================
    // 🔥 Total Count (for pagination)
    // ===============================
    const totalResult = yield mercentSellManagement_model_1.Sell.aggregate([
        {
            $match: {
                merchantId: new mongoose_1.Types.ObjectId(merchantId),
                status: "completed",
            },
        },
        { $group: { _id: "$userId" } },
        { $count: "total" },
    ]);
    const total = ((_a = totalResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    return {
        data,
        pagination: {
            total,
            limit,
            page,
            totalPage: Math.ceil(total / limit),
        },
    };
});
exports.AdminService = {
    createAdminToDB,
    deleteAdminFromDB,
    getAdminFromDB,
    updateUserStatus,
    getAllCustomers,
    getAllMerchants,
    getSingleCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerStatus,
    getSingleMerchant,
    updateMerchant,
    deleteMerchant,
    updateMerchantStatus,
    updateMerchantApproveStatus,
    exportCustomers,
    exportMerchants,
    getNearbyMerchants,
    getCustomerSellDetails,
    getMerchantCustomerStats
};
