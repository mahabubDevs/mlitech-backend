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
exports.PointService = void 0;
// src/app/modules/points/point.service.ts
const transection_model_1 = require("./transection.model");
const mongoose_1 = require("mongoose");
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
// Helper: Map Mongoose doc to clean object
// helper: map transaction document
const mapPointDoc = (doc) => ({
    id: doc._id.toString(),
    type: doc.type,
    points: doc.points,
    source: doc.source,
    subscription: doc.subscriptionId
        ? {
            id: doc.subscriptionId._id.toString(),
            title: doc.subscriptionId.title,
        }
        : null,
    balanceAfter: doc.balanceAfter,
    createdAt: doc.createdAt,
});
const createTransaction = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield transection_model_1.TransactionHistory.create(payload);
    return mapPointDoc(doc);
});
const getTransactions = (userId, query, type) => __awaiter(void 0, void 0, void 0, function* () {
    // Base query
    let baseQuery = transection_model_1.TransactionHistory.find({ userId: new mongoose_1.Types.ObjectId(userId) });
    if (type) {
        baseQuery = baseQuery.find({ type });
    }
    // Initialize QueryBuilder
    const qb = new queryBuilder_1.default(baseQuery, query);
    qb.search(["source"]) // search by source
        .filter()
        .sort()
        .paginate()
        .fields()
        .populate(["subscriptionId"], { title: 1 }); // populate subscription title
    const docs = yield qb.modelQuery.lean();
    const data = docs.map(mapPointDoc);
    const pagination = yield qb.getPaginationInfo();
    return { data, pagination };
});
const getPointsSummary = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const agg = yield transection_model_1.TransactionHistory.aggregate([
        { $match: { userId: new mongoose_1.Types.ObjectId(userId) } },
        {
            $facet: {
                totalAvailable: [
                    { $sort: { createdAt: 1 } },
                    { $group: { _id: null, balance: { $last: "$balanceAfter" } } },
                ],
                thisMonthEarn: [
                    { $match: { type: "EARN", createdAt: { $gte: startOfMonth } } },
                    { $group: { _id: null, points: { $sum: "$points" } } },
                ],
            },
        },
    ]);
    return {
        totalAvailable: ((_a = agg[0].totalAvailable[0]) === null || _a === void 0 ? void 0 : _a.balance) || 0,
        thisMonthEarn: ((_b = agg[0].thisMonthEarn[0]) === null || _b === void 0 ? void 0 : _b.points) || 0,
    };
});
exports.PointService = {
    createTransaction,
    getTransactions,
    getPointsSummary,
};
