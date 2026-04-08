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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const contactUs_model_1 = require("./contactUs.model");
const createContact = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const contact = new contactUs_model_1.ContactUs(data);
    return yield contact.save();
});
const getAllContacts = () => __awaiter(void 0, void 0, void 0, function* () {
    const contacts = yield contactUs_model_1.ContactUs.find().sort({ createdAt: -1 });
    return contacts;
});
exports.ContactService = {
    createContact,
    getAllContacts,
};
