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




const getAllCustomers = async (query: Record<string, unknown>) => {
  // 1️⃣ User data fetch
  const baseQuery = User.find({ role: "USER" }).select(
    "customUserId firstName lastName phone email status address referredInfo.referredBy"
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

  // 2️⃣ Fetch latest subscription per user
  const userIds = allcustomers.map((u: any) => u._id.toString());

  const subscriptions = await Subscription.find({
    user: { $in: userIds },
  })
    .sort({ currentPeriodEnd: -1 }) // latest subscription first
    .lean();

  // 3️⃣ Map latest subscription per user
  const subscriptionMap: Record<string, any> = {};
  subscriptions.forEach((sub) => {
    const userId = sub.user.toString();
    if (!subscriptionMap[userId]) {
      subscriptionMap[userId] = sub; // first one = latest
    }
  });

  // 4️⃣ Merge subscription into user objects & add subscription status
  const customersWithSubscription = allcustomers.map((user) => {
    const subData = subscriptionMap[user._id.toString()] || null;
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
      subscription: subData && subData.status === "active" ? "active" : "inActive",
    };
  });

  console.log(
    "Customers with latest subscription only:",
    JSON.stringify(customersWithSubscription, null, 2)
  );

  return {
    allcustomers: customersWithSubscription,
    pagination,
  };
};

const getAllMerchants = async (query: Record<string, unknown>, user: any) => {
  const { address, service, radius, favorite, ...rest } = query;
  const userId = user?._id;

  // 1️⃣ Database থেকে user location fetch করো
  const userData = await User.findById(userId).select("location").lean();
  const userLocation = userData?.location;

  console.log("📍 Client Location from DB:", userLocation);
  console.log("📏 Radius:", radius);
  console.log("🔍 Search Term:", query.searchTerm);
  console.log("📌 Address Filter:", address);
  console.log("🔧 Service Filter:", service);
  console.log("📏 Radius Filter:", radius);

  // 2️⃣ Base query
  let baseQuery = User.find({ role: USER_ROLES.MERCENT, verified: true });

  const allMerchantsQuery = new QueryBuilder(baseQuery, rest)
    .search([
      "firstName",
      "lastName",
      "email",
      "phone",
      "businessName",
      "service",
      "address",
      "customUserId",
      "location",
      "country",
      "city",
    ])
    .filter()
    .sort()
    .paginate();

  // 3️⃣ Address filter
  if (address) {
    allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
      address: { $regex: address as string, $options: "i" },
    });
  }

  // 4️⃣ Service filter
// Service filter (Array field with partial match)
// 1️⃣ Service filter
if (service) {
  // service field only, case-insensitive, partial match
  const serviceWords = (service as string).split(/\s+|,/); // split input into words
  allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
    $or: serviceWords.map(word => ({
      service: { $regex: word, $options: "i" } // case-insensitive match
    }))
  });
}
  // 5️⃣ Radius filter only if userLocation exists
  if (userLocation && radius) {
    allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
      location: {
        $geoWithin: {
          $centerSphere: [userLocation.coordinates, Number(radius) / 6378.1], // radius in km
        },
      },
    });
  } else if (radius && !userLocation) {
    console.warn("📌 Radius filter skipped: user location undefined in DB");
  }

  // 6️⃣ Fetch merchants, pagination, favorites
  const [allmerchants, pagination, favorites] = await Promise.all([
    allMerchantsQuery.modelQuery.lean(),
    allMerchantsQuery.getPaginationInfo(),
    Favorite.find({ userId }).select("merchantId").lean(),
  ]);

  const favoriteMap = new Set(favorites.map(f => f.merchantId.toString()));

  // 7️⃣ Fetch average rating
  const merchantIds = allmerchants.map(m => m._id);
  const ratingsAgg = await Rating.aggregate([
    { $match: { merchantId: { $in: merchantIds } } },
    { $group: { _id: "$merchantId", avgRating: { $avg: "$rating" } } },
  ]);

  const ratingMap = new Map<string, number>();
  ratingsAgg.forEach(r =>
    ratingMap.set(r._id.toString(), parseFloat(r.avgRating.toFixed(1)))
  );

  // 8️⃣ Combine favorite and rating
  let merchantsWithFavorite = allmerchants.map(merchant => ({
    ...merchant,
    isFavorite: favoriteMap.has((merchant._id as any).toString()),
    rating: ratingMap.get((merchant._id as any).toString()) || 0,
    
  }));

  if (favorite === "true") {
    merchantsWithFavorite = merchantsWithFavorite.filter(m => m.isFavorite);
  }

  return { allmerchants: merchantsWithFavorite, pagination };
};


//============merchant export service ============//
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
  getNearbyMerchants
};
