import { StatusCodes } from "http-status-codes";
import { IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { APPROVE_STATUS, USER_ROLES, USER_STATUS } from "../../../enums/user";
import ApiError from "../../../errors/ApiErrors";
import QueryBuilder from "../../../util/queryBuilder";
import { sendNotification } from "../../../helpers/notificationsHelper";
import { NotificationType } from "../notification/notification.model";
import ExcelJS from "exceljs";
import { Types } from "mongoose";
import { Favorite } from "../customer/favorite/favorite.model";
import { Rating } from "../customer/rating/rating.model";
import { sendPushNotification } from "../../../helpers/sendPushNotification";
import { Subscription } from "../subscription/subscription.model";
import { Sell } from "../mercent/mercentSellManagement/mercentSellManagement.model";
import { DigitalCard } from "../customer/digitalCard/digitalCard.model";


interface IQuery {
  lat?: number;
  lng?: number;
  radius?: number; // in km
  [key: string]: any;
}


const createAdminToDB = async (payload: IUser): Promise<IUser> => {
  const createAdmin: any = await User.create(payload);
  if (!createAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create Admin");
  }
  if (createAdmin) {
    await User.findByIdAndUpdate(
      { _id: createAdmin?._id },
      { verified: true },
      { new: true }
    );
  }
  return createAdmin;
};

const deleteAdminFromDB = async (id: any): Promise<IUser | undefined> => {
  const isExistAdmin = await User.findByIdAndDelete(id);
  if (!isExistAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to delete Admin");
  }
  return;
};

const getAdminFromDB = async (): Promise<IUser[]> => {
  const admins = await User.find({ role: "ADMIN" }).select(
    "name email profile contact location"
  );
  return admins;
};
const updateUserStatus = async (id: string, status: USER_STATUS) => {
  const updatedUser = await User.findByIdAndUpdate(
    new Types.ObjectId(id),
    {
      status,
      lastStatusChanged: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return updatedUser;
};




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



const getAllCustomers = async (query: Record<string, unknown>) => {
  console.log("📥 Query:", query);

  // 1️⃣ Fetch base users (same as your getAllCustomers)
  const baseQuery = User.find({ role: "USER" }).select(
    "customUserId firstName lastName phone email status address referredInfo.referredBy subscription"
  );

  const allCustomersQuery = new QueryBuilder(baseQuery, query)
    .search(["firstName", "lastName", "email", "phone", "customUserId", "address"])
    .filter()
    .paginate()
    .sort();

  const [allcustomers, pagination] = await Promise.all([
    allCustomersQuery.modelQuery.lean<any[]>(),
    allCustomersQuery.getPaginationInfo(),
  ]);

  const userIds = allcustomers.map((u: any) => u._id.toString());

  // 2️⃣ Subscriptions
  const subscriptions = await Subscription.find({
    user: { $in: userIds },
  })
    .sort({ currentPeriodEnd: -1 })
    .lean();

  const subscriptionMap: Record<string, any> = {};
  subscriptions.forEach((sub) => {
    const userId = sub.user.toString();
    if (!subscriptionMap[userId]) subscriptionMap[userId] = sub;
  });

  // 3️⃣ Points
  const digitalCards = await DigitalCard.find({ userId: { $in: userIds } }).lean();
  const pointsMap: Record<string, number> = {};
  digitalCards.forEach((card) => {
    const userId = card.userId.toString();
    pointsMap[userId] = (pointsMap[userId] || 0) + (card.lifeTimeEarnPoints || 0);
  });

  const now = new Date();

  // 4️⃣ Combine sells per user (paginated per customer)
  const customersWithData = await Promise.all(
    allcustomers.map(async (user) => {
      const subData = subscriptionMap[user._id.toString()] || null;
      const isActive =
        subData &&
        subData.status === "active" &&
        new Date(subData.currentPeriodEnd) > now;

      // Fetch sells per customer
      const sellResult = await getCustomerSellDetails(user._id.toString(), query);

      return {
        ...user,
        subscriptionData: subData
          ? {
              currentPeriodStart: subData.currentPeriodStart,
              currentPeriodEnd: subData.currentPeriodEnd,
              status: subData.status,
              price: subData.price,
              package: subData.package,
            }
          : null,
        subscription: isActive ? "active" : "inActive",
        totalPoints: pointsMap[user._id.toString()] || 0,
        totalSellAmount: sellResult.data.reduce(
          (sum, s) => sum + (s.totalBill || 0),
          0
        ),
        sells: sellResult.data, // attach sells array
        sellsPagination: sellResult.pagination,
      };
    })
  );

  return {
    allcustomers: customersWithData,
    pagination, // customer pagination
  };
};




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

const getAllMerchants = async (query: Record<string, unknown>, user: any) => {
  const { address, service, radius, favorite, limit = 10, page = 1, ...rest } = query;
  const userId = user?._id;

  // 1️⃣ Fetch user location
  const userData = await User.findById(userId).select("location").lean();
  const userLocation = userData?.location;

  // 2️⃣ Base query
  let baseQuery = User.find({ role: USER_ROLES.MERCENT, verified: true });
  const allMerchantsQuery = new QueryBuilder(baseQuery, rest)
    .search([
      "firstName", "lastName", "email", "phone", "businessName",
      "service", "address", "customUserId", "location", "country", "city"
    ])
    .filter()
    .sort()
    .paginate();

  // 3️⃣ Address filter
  if (address) allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({ address: { $regex: address as string, $options: "i" } });

  // 4️⃣ Service filter
  if (service) {
    const serviceWords = (service as string).split(/\s+|,/);
    allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({ $or: serviceWords.map(word => ({ service: { $regex: word, $options: "i" } })) });
  }

  // 5️⃣ Radius filter
  if (userLocation && radius) {
    allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
      location: { $geoWithin: { $centerSphere: [userLocation.coordinates, Number(radius) / 6378.1] } }
    });
  }

  // 6️⃣ Fetch merchants, pagination, favorites
  const [allmerchants, pagination, favorites] = await Promise.all([
    allMerchantsQuery.modelQuery.lean(),
    allMerchantsQuery.getPaginationInfo(),
    Favorite.find({ userId }).select("merchantId").lean(),
  ]);

  const favoriteMap = new Set(favorites.map(f => f.merchantId.toString()));
  const merchantIds = allmerchants.map(m => m._id);

  // 7️⃣ Fetch ratings
  const ratingsAgg = await Rating.aggregate([
    { $match: { merchantId: { $in: merchantIds } } },
    { $group: { _id: "$merchantId", avgRating: { $avg: "$rating" }, ratingCount: { $sum: 1 } } }
  ]);

  const ratingMap = new Map<string, { avgRating: number; ratingCount: number }>();
  ratingsAgg.forEach(r => ratingMap.set(r._id.toString(), { avgRating: parseFloat(r.avgRating.toFixed(1)), ratingCount: r.ratingCount }));

  // 8️⃣ Fetch total revenue & transactions
  const salesAgg = await Sell.aggregate([
    { $match: { merchantId: { $in: merchantIds }, status: "completed" } },
    { $group: { _id: "$merchantId", totalRevenue: { $sum: "$discountedBill" }, totalTransactions: { $sum: 1 } } }
  ]);

  const salesMap = new Map<string, { totalRevenue: number; totalTransactions: number }>();
  salesAgg.forEach(s => salesMap.set(s._id.toString(), { totalRevenue: s.totalRevenue, totalTransactions: s.totalTransactions }));

  // 9️⃣ Fetch all customer stats
  const customerStatsAgg = await Sell.aggregate([
    { $match: { merchantId: { $in: merchantIds }, status: "completed" } },
    { $group: { _id: { merchantId: "$merchantId", userId: "$userId" }, totalSellAmount: { $sum: "$totalBill" }, totalEarnedPoints: { $sum: "$pointsEarned" }, totalRedeemedPoints: { $sum: "$pointRedeemed" }, totalTransactions: { $sum: 1 } } },
    { $lookup: { from: "users", localField: "_id.userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { merchantId: "$_id.merchantId", userId: "$_id.userId", customUserId: "$user.customUserId", name: { $concat: [{ $ifNull: ["$user.firstName", ""] }, " ", { $ifNull: ["$user.lastName", ""] }] }, email: "$user.email", totalSellAmount: 1, totalEarnedPoints: 1, totalRedeemedPoints: 1, totalTransactions: 1 } }
  ]);

  const customerStatsMap = new Map<string, any[]>();
  customerStatsAgg.forEach(stat => {
    const key = stat.merchantId.toString();
    if (!customerStatsMap.has(key)) customerStatsMap.set(key, []);
    customerStatsMap.get(key)!.push(stat);
  });

  // 10️⃣ Combine merchants with all customers
  let merchantsWithFavorite = allmerchants.map(merchant => {
    const merchantIdStr = (merchant._id as any).toString();
    const salesData = salesMap.get(merchantIdStr);
    const ratingData = ratingMap.get(merchantIdStr);
    const allCustomers = customerStatsMap.get(merchantIdStr) || []; // ✅ all customers

    return {
      ...merchant,
      isFavorite: favoriteMap.has(merchantIdStr),
      rating: ratingData?.avgRating || 0,
      ratingCount: ratingData?.ratingCount || 0,
      totalRevenue: salesData?.totalRevenue || 0,
      totalTransactions: salesData?.totalTransactions || 0,
      customers: allCustomers
    };
  });

  if (favorite === "true") merchantsWithFavorite = merchantsWithFavorite.filter(m => m.isFavorite);

  return { allmerchants: merchantsWithFavorite, pagination };
};


const exportMerchants = async (
  query: Record<string, unknown>
): Promise<Buffer> => {
  /* ---------------- Base Query ---------------- */
  const baseQuery = User.find({ role: USER_ROLES.MERCENT }).select(
    "customUserId firstName lastName email phone status address createdAt"
  );

  /* ---------------- Apply Filters ---------------- */
  const merchantsQuery = new QueryBuilder(baseQuery, query)
    .search(["firstName", "lastName", "email", "phone"])
    .filter()
    .sort();

  const merchants = await merchantsQuery.modelQuery.lean<any[]>();

  /* ---------------- Excel ---------------- */
  const workbook = new ExcelJS.Workbook();
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
    sheet.addRow({
      ...m,
      createdAt: m.createdAt
        ? new Date(m.createdAt).toLocaleString()
        : "",
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = "A1:H1";

  /* ---------------- Buffer ---------------- */
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
};

// near merchants service

const getNearbyMerchants = async (query: IQuery, userId: string) => {
  const user = await User.findById(userId).select("location");
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const lng = user.location?.coordinates?.[0];
  const lat = user.location?.coordinates?.[1];

  if (lng == null || lat == null) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User location not found");
  }

  const radius = query.radius ? Number(query.radius) : 10; // km
  const searchTerm = query.searchTerm ? String(query.searchTerm) : null;
  const radiusInMeters = radius * 1000;

  const pipeline: any[] = [
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
        role: USER_ROLES.MERCENT,
        status: USER_STATUS.ACTIVE,
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

    pipeline.push(
    {
      $lookup: {
        from: "ratings",
        localField: "_id",
        foreignField: "merchantId",
        as: "ratings",
      },
    },
    {
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
    },
    {
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
    },
    { $sort: { distance: 1 } }
  );


  const merchants = await User.aggregate(pipeline);
  return merchants;
};


// ====== customer crue operations ====== //
//==== single customer details ====//

const getSingleCustomer = async (id: string) => {
  const user = await User.findOne({ _id: id, role: "USER" }).lean();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
  }
  return user;
};

//===== update customer ======//

const updateCustomer = async (id: string, payload: Record<string, unknown>) => {
  const customer = await User.findOneAndUpdate(
    { _id: id, role: "USER" },
    payload,
    { new: true, runValidators: true }
  ).lean();

  if (!customer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
  }

  return customer;
};

//===== delete customer ======//

const deleteCustomer = async (id: string) => {
  const user = await User.findOneAndDelete({ _id: id, role: "USER" }).lean();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
  }

  return user;
};

//===== customer status update ======//
const updateCustomerStatus = async (
  id: string,
  status: "active" | "inactive"
) => {
  const user = await User.findOneAndUpdate(
    { _id: id, role: "USER" },
    { status },
    { new: true }
  ).lean();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
  }

  return user;
};

//================== mercent crue operations ===================//
//=== singel merchant details ===//
const getSingleMerchant = async (id: string) => {
  const merchant = await User.findById(id).lean();

  if (!merchant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  return merchant;
};

//==== update merchant ====//
const updateMerchant = async (id: string, payload: Record<string, unknown>) => {
  const merchant = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!merchant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  return merchant;
};

//==== delete merchant ====//
const deleteMerchant = async (id: string) => {
  console.log("Delete Merchant called for ID:", id);

  const merchant = await User.findById(id).lean();
  if (!merchant) {
    console.log("Merchant not found in DB");
    throw new ApiError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  console.log("Merchant found:", merchant.firstName, merchant.email, merchant.fcmToken);

  // 1️⃣ Send push notification
  if (merchant.fcmToken) {
    console.log("Sending push notification to:", merchant.fcmToken);
    await sendPushNotification(
      merchant.fcmToken,
      "Account Deleted",
      "Your merchant account has been deleted by Admin."
    );
    console.log("Push notification sent");
  } else {
    console.log("No FCM token found, skipping notification");
  }

      // 2️⃣ Save DB Notification for Super Admin(s)


        // 🔎 Find Super Admin(s)
  const superAdmins = await User.find({
    role: USER_ROLES.SUPER_ADMIN,
  }).select("_id fcmToken");

  if (!superAdmins.length) {
    console.log("No Super Admin found");
  }

  await sendNotification({
    userIds: superAdmins.map((admin) => admin._id),
    title: `Merchant ${merchant.firstName} (${merchant.email}) has been deleted by Admin.`,
    body: `Merchant ${merchant.firstName} (${merchant.email}) has been deleted by Admin.`,
    type: NotificationType.MANUAL,
  });


  // 2️⃣ Delete merchant
  const deleted = await User.findByIdAndDelete(id);
  console.log("Merchant deleted from DB:", deleted?._id);

  return merchant;
};



//==== merchant status update ====//

const updateMerchantStatus = async (
  id: string,
  status: "active" | "inActive"
) => {
  const merchant = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).lean();

  if (!merchant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  return merchant;
};


const updateMerchantApproveStatus = async (
  id: string,
  approveStatus: APPROVE_STATUS,
  adminId: string
) => {
  const merchant = await User.findById(id).lean();
  if (!merchant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  if (merchant.approveStatus === approveStatus) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Merchant already has this status");
  }
  let data: Record<string, unknown> = {
    approveStatus,

  }
  if (approveStatus === APPROVE_STATUS.APPROVED) {
    const adminName = await User.findById(adminId).select("firstName lastName").lean()
    if (!adminName) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    }
    data.status = USER_STATUS.ACTIVE
    data.salesRep = `${adminName.firstName} ${adminName.lastName ?? ""}`.trim();
  }


  const result = await User.findByIdAndUpdate(
    id,
    data,
    { new: true }
  ).lean();



  if (approveStatus === APPROVE_STATUS.APPROVED) {

if (merchant.fcmToken) {
    console.log("Sending push notification to:", merchant.fcmToken);
    await sendPushNotification(
      merchant.fcmToken,
      "Account Approved",
      "Your merchant account has been approved by Admin."
    );
    console.log("Push notification sent");
  } else {
    console.log("No FCM token found, skipping notification");
  }

    await sendNotification({
      userIds: [merchant._id],
      title: "Congratulations! Your account Approved",
      body: `Welcome ${merchant.firstName}, Your account has been approved successfully`,
      type: NotificationType.WELCOME,
    })
  }

  const superAdmins = await User.find({
    role: USER_ROLES.SUPER_ADMIN,
  }).select("_id fcmToken");

  if (!superAdmins.length) {
    console.log("No Super Admin found");
  }

  await sendNotification({
    userIds: superAdmins.map((admin) => admin._id),
    title: `Merchant ${merchant.firstName} (${merchant.email}) has been approved.`,
    body: `Merchant ${merchant.firstName} (${merchant.email}) has been approved by Admin.`,
    type: NotificationType.MANUAL,
  });



  return result;
};



const exportCustomers = async (
  query: Record<string, unknown>
): Promise<Buffer> => {
  /* ---------------- Base Query ---------------- */
  const baseQuery = User.find({ role: "USER" }).select(
    "customUserId firstName lastName email phone status address createdAt"
  );

  /* ---------------- Apply Filters ---------------- */
  const customersQuery = new QueryBuilder(baseQuery, query)
    .search(["firstName", "lastName", "email", "phone"])
    .filter()
    .sort();

  const customers = await customersQuery.modelQuery.lean<any[]>();



  /* ---------------- Excel ---------------- */
  const workbook = new ExcelJS.Workbook();
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
    sheet.addRow({
      ...c,
      createdAt: new Date(c.createdAt).toLocaleString(),
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = "A1:H1";

  /* ---------------- Buffer ---------------- */
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
};


const getCustomerSellDetails = async (
  userId: string,
  query: Record<string, unknown>
) => {
  console.log("📥 UserId:", userId);

  // ===============================
  // 🔥 Base Query
  // ===============================
  const baseQuery = Sell.find({
    userId,
    status: "completed",
  }).populate("merchantId", "firstName businessName email");

  // ===============================
  // 🔥 Query Builder Apply
  // ===============================
  const sellQuery = new QueryBuilder(baseQuery, query)
    .filter()
    .sort()
    .paginate();

  const [sells, pagination] = await Promise.all([
    sellQuery.modelQuery.lean<any[]>(),
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
    finalPoints:
      (sell.pointsEarned || 0) - (sell.pointRedeemed || 0),
    status: sell.status,
    date: sell.createdAt,
  }));

  return {
    data: formattedSells,
    pagination,
  };
};





const getMerchantCustomerStats = async (
  merchantId: string,
  query: Record<string, unknown>
) => {
  console.log("📥 MerchantId:", merchantId);

  const limit = Number(query.limit) || 10;
  const page = Number(query.page) || 1;
  const skip = (page - 1) * limit;

  // ===============================
  // 🔥 Aggregation Pipeline
  // ===============================
  const pipeline: any[] = [
    {
      $match: {
        merchantId: new Types.ObjectId(merchantId),
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

  const data = await Sell.aggregate(pipeline);

  // ===============================
  // 🔥 Total Count (for pagination)
  // ===============================
  const totalResult = await Sell.aggregate([
    {
      $match: {
        merchantId: new Types.ObjectId(merchantId),
        status: "completed",
      },
    },
    { $group: { _id: "$userId" } },
    { $count: "total" },
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    data,
    pagination: {
      total,
      limit,
      page,
      totalPage: Math.ceil(total / limit),
    },
  };
};

export const AdminService = {
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
