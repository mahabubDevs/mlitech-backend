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
exports.ContactController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const contactUs_service_1 = require("./contactUs.service");
const queryBuilder_1 = __importDefault(require("../../../util/queryBuilder"));
const contactUs_model_1 = require("./contactUs.model");
const createContact = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, subject, message } = req.body;
    const result = yield contactUs_service_1.ContactService.createContact({
        name,
        email,
        subject,
        message,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Contact message submitted successfully",
        data: result,
    });
}));
const getAllContacts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Start query
    const modelQuery = contactUs_model_1.ContactUs.find();
    // 2️⃣ Initialize QueryBuilder
    const contactsQuery = new queryBuilder_1.default(modelQuery, req.query)
        .search(['firstName', 'email', 'phone', 'message']) // যদি searchTerm থাকে
        .filter() // filtering by query params
        .sort() // sort by query param
        .paginate() // pagination
        .fields(); // fields selection
    // 3️⃣ Execute query
    const contacts = yield contactsQuery.modelQuery;
    // 4️⃣ Get pagination info
    const pagination = yield contactsQuery.getPaginationInfo();
    // 5️⃣ Send response
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'All contact messages fetched successfully',
        data: contacts,
        pagination,
    });
}));
exports.ContactController = {
    createContact,
    getAllContacts,
};
