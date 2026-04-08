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
const colors_1 = __importDefault(require("colors"));
const user_model_1 = require("../app/modules/user/user.model");
const config_1 = __importDefault(require("../config"));
const user_1 = require("../enums/user");
const logger_1 = require("../shared/logger");
const generateRefferalId_1 = require("../util/generateRefferalId");
const superUser = {
    firstName: "Super", // put client first name
    lastName: "Admin", // put client last name
    role: user_1.USER_ROLES.SUPER_ADMIN,
    phone: "+8801700000000", // put client phone number
    email: config_1.default.admin.email,
    password: config_1.default.admin.password,
    verified: true,
};
const seedSuperAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const isExistSuperAdmin = yield user_model_1.User.findOne({
        role: user_1.USER_ROLES.SUPER_ADMIN,
    });
    if (!isExistSuperAdmin) {
        const referenceId = yield (0, generateRefferalId_1.createUniqueReferralId)();
        const superUserData = Object.assign(Object.assign({}, superUser), { referenceId });
        yield user_model_1.User.create(superUserData);
        logger_1.logger.info(colors_1.default.green("✔ Super admin created successfully!"));
    }
});
exports.default = seedSuperAdmin;
