import { Shop } from "./shop.model";
import { ICreateShop, IUpdateShop, IShopDB } from "./shop.interface";
import QueryBuilder from "../../../util/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

// Helper: Map Mongoose doc to IShopDB
const mapShopDocToIShopDB = (doc: any): IShopDB => ({
  _id: doc._id.toString(),
  bundleType: doc.bundleType,
  status: doc.status,
  callBundle: doc.callBundle,
  auraBundle: doc.auraBundle,
  createdBy: doc.createdBy ? doc.createdBy.toString() : undefined,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Create
const createShopInDB = async (payload: ICreateShop): Promise<IShopDB> => {
  const doc = await Shop.create(payload);
  return mapShopDocToIShopDB(doc);
};

// Update
const updateShopInDB = async (shopId: string, payload: IUpdateShop): Promise<IShopDB> => {
  const doc = await Shop.findByIdAndUpdate(shopId, payload, { new: true, runValidators: true });
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "Shop bundle not found");
  return mapShopDocToIShopDB(doc);
};

// Delete
const deleteShopFromDB = async (shopId: string): Promise<IShopDB> => {
  const doc = await Shop.findByIdAndDelete(shopId);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "Shop bundle not found");
  return mapShopDocToIShopDB(doc);
};

// Toggle status
const toggleShopStatusInDB = async (shopId: string) => {
  const doc = await Shop.findById(shopId);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "Shop bundle not found");
  doc.status = doc.status === "active" ? "block" : "active";
  await doc.save();
  return { id: doc._id.toString(), status: doc.status };
};

// Get all
const getShopsFromDB = async (query: any) => {
  let baseQuery = Shop.find({});
  const qb = new QueryBuilder(baseQuery, query);

  qb.search(["bundleType"]);

  if (query.status) {
    if (query.status === "active") qb.modelQuery = qb.modelQuery.find({ status: "active" });
    if (query.status === "block") qb.modelQuery = qb.modelQuery.find({ status: "block" });
  }

  qb.filter().sort().paginate().fields();

  const docs = await qb.modelQuery.lean();
  const data = docs.map((doc: any) => ({
    ...doc,
    _id: doc._id.toString(),
    createdBy: doc.createdBy ? doc.createdBy.toString() : undefined,
  }));

  const pagination = await qb.getPaginationInfo();

  return { data, pagination };
};

// Get single
const getSingleShopFromDB = async (id: string) => {
  const shop = await Shop.findById(id);
  if (!shop) throw new ApiError(StatusCodes.NOT_FOUND, "Shop bundle not found");
  return shop;
};

export const ShopService = {
  createShopInDB,
  updateShopInDB,
  deleteShopFromDB,
  toggleShopStatusInDB,
  getShopsFromDB,
  getSingleShopFromDB,
};
