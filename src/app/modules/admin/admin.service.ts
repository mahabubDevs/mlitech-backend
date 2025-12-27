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
  const baseQuery = User.find({ role: "USER" }).select(
    "customUserId firstName lastName phone email status address referredInfo.referredBy subscription"
  );

  const allCusomtersQuery = new QueryBuilder(baseQuery, query)
    .search(["firstName", "lastName", "email", "phone"])
    .filter()
    .paginate()
    .sort();

  const [allcustomers, pagination] = await Promise.all([
    allCusomtersQuery.modelQuery.lean(),
    allCusomtersQuery.getPaginationInfo(),
  ]);
  return {
    allcustomers,
    pagination,
  };
};

const getAllMerchants = async (query: Record<string, unknown>, user: any) => {
  const { address, service, radius, favorite, ...rest } = query;
  const { location: userLocation, _id: userId } = user;

  let baseQuery = User.find({ role: USER_ROLES.MERCENT });

  const allMerchantsQuery = new QueryBuilder(baseQuery, rest)
    .search(["firstName", "lastName", "email", "phone"])
    .filter()
    .sort()
    .paginate();

  if (address) {
    allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
      address: { $regex: address as string, $options: "i" },
    });
  }

  if (service) {
    allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
      service: { $regex: service as string, $options: "i" },
    });
  }

  if (userLocation && radius) {
    allMerchantsQuery.modelQuery = allMerchantsQuery.modelQuery.find({
      location: {
        $geoWithin: {
          $centerSphere: [userLocation.coordinates, Number(radius) / 6378.1],
        },
      },
    });
  }

  // 3️⃣ Fetch merchants and pagination
  const [allmerchants, pagination, favorites] = await Promise.all([
    allMerchantsQuery.modelQuery.lean(),
    allMerchantsQuery.getPaginationInfo(),
    Favorite.find({ userId }).select("merchantId").lean(),
  ]);

  // 4️⃣ Create favorite map
  const favoriteMap = new Set(favorites.map(f => f.merchantId.toString()));

  // 5️⃣ Mark favorites and apply filter if favorite query exists
  let merchantsWithFavorite = allmerchants.map(merchant => ({
    ...merchant,
    isFavorite: favoriteMap.has((merchant._id as any).toString()),
  }));

  if (favorite === "true") {
    merchantsWithFavorite = merchantsWithFavorite.filter(m => m.isFavorite);
  } else if (favorite === "false") {
    merchantsWithFavorite = merchantsWithFavorite.filter(m => !m.isFavorite);
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
            { $avg: "$ratings.rating" },
            0,
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
  const merchant = await User.findByIdAndDelete(id).lean();

  if (!merchant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

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



    await sendNotification({
      userIds: [merchant._id],
      title: "Congratulations! Your account Approved",
      body: `Welcome ${merchant.firstName}, Your account has been approved successfully`,
      type: NotificationType.WELCOME,
    })
  }

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
