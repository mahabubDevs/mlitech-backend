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
exports.PackageService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const package_model_1 = require("./package.model");
const mongoose_1 = __importDefault(require("mongoose"));
const stripe_1 = __importDefault(require("../../../config/stripe"));
const createSubscriptionProductHelper_1 = require("../../../helpers/createSubscriptionProductHelper");
const createPackageToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("📦 Incoming Payload:", payload);
    // ✅ Check existing package
    const existingPackage = yield package_model_1.Package.findOne({
        duration: payload.duration,
        admin: payload.admin,
        status: "Active",
    });
    console.log("🔍 Existing Package Check Result:", existingPackage);
    if (existingPackage) {
        console.log("⚠️ Package already exists, returning existing one");
        return existingPackage;
    }
    // 🔹 If price is 0, mark as free plan
    if (payload.price === 0) {
        payload.isFreeTrial = true;
        console.log("🎁 Marked as Free Trial Package");
    }
    // ✅ Create Stripe Product + Price
    console.log("🚀 Creating Stripe Product...");
    const product = yield (0, createSubscriptionProductHelper_1.createSubscriptionProduct)({
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        price: payload.price,
    });
    console.log("💳 Stripe Product Created:", product);
    // Assign only available fields
    payload.productId = product.productId;
    payload.priceId = product.priceId;
    console.log("📝 Final Payload Before DB Save:", payload);
    // Save to DB
    const result = yield package_model_1.Package.create(payload);
    console.log("✅ Package Saved to DB:", result);
    // Optionally: delete Stripe product if DB save fails
    if (!result) {
        console.log("❌ DB Save Failed, deleting Stripe product...");
        yield stripe_1.default.products.del(product.productId);
    }
    return result;
});
const updatePackageToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid ID");
    }
    const existingPackage = yield package_model_1.Package.findById(id);
    if (!existingPackage)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Package not found");
    if (payload.duration) {
        const duplicate = yield package_model_1.Package.findOne({
            duration: payload.duration,
            admin: existingPackage.admin,
            status: "Active",
            _id: { $ne: id },
        });
        if (duplicate) {
            throw new ApiErrors_1.default(400, `Package already exists for ${payload.duration}`);
        }
    }
    // Update Stripe product
    if (payload.title || payload.description) {
        yield stripe_1.default.products.update(existingPackage.productId, {
            name: payload.title || existingPackage.title,
            description: payload.description || existingPackage.description,
        });
    }
    // Update Stripe price if price changed
    if (payload.price && payload.price !== existingPackage.price) {
        const newPrice = yield stripe_1.default.prices.create({
            unit_amount: payload.price * 100,
            currency: "usd",
            product: existingPackage.productId,
            recurring: { interval: ((_a = payload.paymentType) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'monthly' ? 'month' : 'year' },
        });
        payload.priceId = newPrice.id;
        const paymentLink = yield stripe_1.default.paymentLinks.create({
            line_items: [{ price: newPrice.id, quantity: 1 }]
        });
        payload.paymentLink = paymentLink.url;
    }
    return package_model_1.Package.findByIdAndUpdate(id, payload, { new: true });
});
const getPackageFromDB = (paymentType) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {};
    if (paymentType)
        query.paymentType = paymentType;
    return package_model_1.Package.find(query);
});
const getSinglePackageFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return package_model_1.Package.findById(id).where({ status: "Active" });
});
const getPackageDetailsFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid ID");
    return package_model_1.Package.findById(id);
});
const deletePackageToDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid ID");
    const result = yield package_model_1.Package.findByIdAndDelete(id);
    if (!result)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to delete package");
    return result;
});
const togglePackageStatusInDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid ID");
    const existingPackage = yield package_model_1.Package.findById(id);
    if (!existingPackage)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Package not found");
    const newStatus = existingPackage.status === "Active" ? "Inactive" : "Active";
    return package_model_1.Package.findByIdAndUpdate(id, { status: newStatus }, { new: true });
});
const getActivePackagesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return package_model_1.Package.find({ status: "Active" });
});
exports.PackageService = {
    createPackageToDB,
    updatePackageToDB,
    getPackageFromDB,
    getPackageDetailsFromDB,
    deletePackageToDB,
    getSinglePackageFromDB,
    togglePackageStatusInDB,
    getActivePackagesFromDB
};
