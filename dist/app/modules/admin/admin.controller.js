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
exports.AdminController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const admin_service_1 = require("./admin.service");
const createAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const result = yield admin_service_1.AdminService.createAdminToDB(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Admin created Successfully",
        data: result,
    });
}));
const deleteAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.params.id;
    const result = yield admin_service_1.AdminService.deleteAdminFromDB(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Admin Deleted Successfully",
        data: result,
    });
}));
const getAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.getAdminFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Admin Retrieved Successfully",
        data: result,
    });
}));
const updateUserStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.updateUserStatus(req.params.id, req.body.status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User status updated Successfully",
        data: result,
    });
}));
const getAllCustomers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.getAllCustomers(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "All customers Retrieved Successfully",
        data: result.allcustomers,
        pagination: result.pagination,
    });
}));
//================= customer export ===================//
const exportCustomers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const buffer = yield admin_service_1.AdminService.exportCustomers(req.query);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");
    res.send(buffer);
}));
// near merchants controller
const getNearbyMerchantsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield admin_service_1.AdminService.getNearbyMerchants(req.query, user._id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Nearby merchants retrieved successfully",
        data: result,
    });
}));
const getAllMerchants = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.getAllMerchants(req.query, req.user); // req.user পাঠানো
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "All merchants Retrieved Successfully",
        data: result.allmerchants,
        pagination: result.pagination,
    });
}));
//=============== mercent export ===================//
const exportMerchants = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const buffer = yield admin_service_1.AdminService.exportMerchants(req.query);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=merchants.xlsx");
    res.send(buffer);
}));
// ======== customer crue operations ======== //
//=== singel customer details ===//
const getSingleCustomer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.getSingleCustomer(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Customer retrieved successfully",
        data: result,
    });
}));
//===== update customer ======//
const updateCustomer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = req.params.id;
    // First extract body
    let bodyData = req.body;
    // If form-data contains "data" JSON string → parse to real object
    if (bodyData.data) {
        bodyData = JSON.parse(bodyData.data);
    }
    // Now handle uploaded image
    const files = req.files;
    if ((_a = files === null || files === void 0 ? void 0 : files.image) === null || _a === void 0 ? void 0 : _a.length) {
        bodyData.profile = files.image[0].path;
    }
    console.log("🔥 FINAL PAYLOAD =>", bodyData);
    const result = yield admin_service_1.AdminService.updateCustomer(id, bodyData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Customer updated successfully",
        data: result,
    });
}));
//===== delete customer ======//
const deleteCustomer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield admin_service_1.AdminService.deleteCustomer(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Customer deleted successfully",
        data: null,
    });
}));
//===== customer status update ======//
const updateCustomerStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.updateCustomerStatus(req.params.id, req.body.status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Customer status updated successfully",
        data: result,
    });
}));
//================= mercent crue operations ===================//
//=== singel merchant details ===//
const getSingleMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.getSingleMerchant(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant retrieved successfully",
        data: result,
    });
}));
//===== update merchant ======//
const updateMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    // All JSON data from form-data comes as strings
    // So we need to parse them
    let payload = Object.assign({}, req.body);
    // If data object is string, parse it
    if (payload.data) {
        payload = JSON.parse(payload.data);
    }
    // Handle files
    const files = req.files;
    if ((files === null || files === void 0 ? void 0 : files.image) && files.image.length > 0) {
        payload.profile = files.image[0].path; // Attach image path to payload
    }
    const result = yield admin_service_1.AdminService.updateMerchant(id, payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant updated successfully",
        data: result,
    });
}));
//===== delete merchant ======//
const deleteMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield admin_service_1.AdminService.deleteMerchant(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant deleted successfully",
    });
}));
//===== merchant status update ======//
const updateMerchantStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.updateMerchantStatus(req.params.id, req.body.status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant status updated successfully",
        data: result,
    });
}));
const updateMerchantApproveStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield admin_service_1.AdminService.updateMerchantApproveStatus(req.params.id, req.body.approveStatus, user._id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant approve status updated successfully",
        data: result,
    });
}));
const getCustomerSellDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield admin_service_1.AdminService.getCustomerSellDetails(userId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Customer sell list retrieved successfully",
        data: result.data,
        pagination: result.pagination,
    });
}));
const getMerchantCustomerStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { merchantId } = req.params;
    const result = yield admin_service_1.AdminService.getMerchantCustomerStats(merchantId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Merchant customer stats retrieved successfully",
        data: result.data,
        pagination: result.pagination,
    });
}));
exports.AdminController = {
    deleteAdmin,
    createAdmin,
    getAdmin,
    updateUserStatus,
    getAllCustomers,
    exportCustomers,
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
    exportMerchants,
    getNearbyMerchantsController,
    getCustomerSellDetails,
    getMerchantCustomerStats
};
