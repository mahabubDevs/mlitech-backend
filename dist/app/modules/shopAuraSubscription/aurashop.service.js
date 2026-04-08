"use strict";
// src/modules/package/package.service.ts
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
exports.AuraSubscriptionService = void 0;
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const subscription_model_1 = require("../subscription/subscription.model");
const aurashop_module_1 = require("./aurashop.module");
// const createPackage= async (payload: IPackage) => {
//     // 1️⃣ Create Stripe Product
//     const product = await stripe.products.create({
//       name: payload.title,
//       description: payload.description,
//     });
//     // Map duration to interval
//     let interval: 'day' | 'week' | 'month' | 'year' = 'month';
//     let intervalCount = 1;
//     switch (payload.duration) {
//       case "1 day": interval = "day"; break;
//       case '1 week': interval = 'week'; break;
//       case '1 month': interval = 'month'; break;
//       case '3 months': interval = 'month'; intervalCount = 3; break;
//       case '6 months': interval = 'month'; intervalCount = 6; break;
//       case '1 year': interval = 'year'; break;
//       default: interval = 'month';
//     }
//     // 2️⃣ Create Stripe Price
//     const price = await stripe.prices.create({
//       product: product.id,
//       unit_amount: Math.round(payload.price * 100),
//       currency: "usd",
//       recurring: { interval, interval_count: intervalCount },
//     });
//     // 3️⃣ Save in DB
//     const newPackage = await Package.create({
//       ...payload,
//       productId: product.id,
//       priceId: price.id,
//     });
//     return newPackage;
//   };
const updatePackage = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updated = yield aurashop_module_1.Package.findByIdAndUpdate(id, payload, { new: true });
    if (!updated)
        throw new Error("Package not found");
    return updated;
});
const deletePackage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield aurashop_module_1.Package.findByIdAndDelete(id);
    if (!deleted)
        throw new Error("Package not found");
    return deleted;
});
const togglePackage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const pkg = yield aurashop_module_1.Package.findById(id);
    if (!pkg)
        throw new Error("Package not found");
    pkg.isActive = !pkg.isActive;
    yield pkg.save();
    return pkg;
});
const getSinglePackage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const pkg = yield aurashop_module_1.Package.findById(id);
    if (!pkg)
        throw new Error("Package not found");
    return pkg;
});
const getAllPackages = (query) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Raw query:", query);
    const builder = new queryBuilder_1.default(aurashop_module_1.Package.find(), query)
        .search(['title', 'description'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const packages = yield builder.modelQuery;
    console.log("Mongoose query filter:", builder.modelQuery.getFilter());
    const pagination = yield builder.getPaginationInfo();
    // add total users per package
    const dataWithUserCount = yield Promise.all(packages.map((pkg) => __awaiter(void 0, void 0, void 0, function* () {
        const totalUsers = yield subscription_model_1.Subscription.countDocuments({ packageId: pkg._id });
        return Object.assign(Object.assign({}, pkg.toObject()), { totalUsers });
    })));
    return Object.assign({ data: dataWithUserCount }, pagination);
});
exports.AuraSubscriptionService = {
    // createPackage,
    updatePackage,
    deletePackage,
    togglePackage,
    getSinglePackage,
    getAllPackages,
};
