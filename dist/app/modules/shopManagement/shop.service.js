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
exports.ShopService = void 0;
const shop_model_1 = require("./shop.model");
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
// Helper: Map Mongoose doc to IShopDB
const mapShopDocToIShopDB = (doc) => ({
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
const createShopInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield shop_model_1.Shop.create(payload);
    return mapShopDocToIShopDB(doc);
});
// Update
const updateShopInDB = (shopId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield shop_model_1.Shop.findByIdAndUpdate(shopId, payload, { new: true, runValidators: true });
    if (!doc)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Shop bundle not found");
    return mapShopDocToIShopDB(doc);
});
// Delete
const deleteShopFromDB = (shopId) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield shop_model_1.Shop.findByIdAndDelete(shopId);
    if (!doc)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Shop bundle not found");
    return mapShopDocToIShopDB(doc);
});
// Toggle status
const toggleShopStatusInDB = (shopId) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield shop_model_1.Shop.findById(shopId);
    if (!doc)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Shop bundle not found");
    doc.status = doc.status === "active" ? "block" : "active";
    yield doc.save();
    return { id: doc._id.toString(), status: doc.status };
});
// Get all
const getShopsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    let baseQuery = shop_model_1.Shop.find({});
    const qb = new queryBuilder_1.default(baseQuery, query);
    qb.search(["bundleType"]);
    if (query.status) {
        if (query.status === "active")
            qb.modelQuery = qb.modelQuery.find({ status: "active" });
        if (query.status === "block")
            qb.modelQuery = qb.modelQuery.find({ status: "block" });
    }
    qb.filter().sort().paginate().fields();
    const docs = yield qb.modelQuery.lean();
    const data = docs.map((doc) => (Object.assign(Object.assign({}, doc), { _id: doc._id.toString(), createdBy: doc.createdBy ? doc.createdBy.toString() : undefined })));
    const pagination = yield qb.getPaginationInfo();
    return { data, pagination };
});
// Get single
const getSingleShopFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const shop = yield shop_model_1.Shop.findById(id);
    if (!shop)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Shop bundle not found");
    return shop;
});
exports.ShopService = {
    createShopInDB,
    updateShopInDB,
    deleteShopFromDB,
    toggleShopStatusInDB,
    getShopsFromDB,
    getSingleShopFromDB,
};
