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
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enums/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../../../config"));
const mongoose_2 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    customUserId: {
        type: String,
        index: true,
        unique: true,
        required: false,
    },
    merchantId: {
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: "User",
        default: null, // 🔥 required false এর চেয়ে better
    },
    createdBy: {
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: false,
        unique: false,
        lowercase: false,
    },
    businessName: {
        type: String,
        required: false,
    },
    appId: {
        type: String,
        required: false,
    },
    latestToken: {
        type: String,
    },
    fcmToken: {
        type: String,
    },
    referenceId: {
        type: String,
        unique: true,
        required: false,
    },
    referredInfo: {
        _id: false,
        type: {
            referredId: {
                type: String,
                required: false,
            },
            referredBy: {
                type: String,
                required: false,
            },
            referredUserId: {
                type: String,
                required: false,
            },
        }
    },
    salesRep: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: Object.values(user_1.USER_ROLES),
        default: user_1.USER_ROLES.USER,
        required: false,
    },
    email: {
        type: String,
        lowercase: true,
    },
    phone: {
        type: String,
    },
    password: {
        type: String,
        select: 0,
    },
    googleId: { type: String, },
    appleId: { type: String, },
    authProviders: {
        type: [String],
        enum: ["local", "google", "apple"],
        default: ["local"],
    },
    country: {
        type: String,
        required: false,
    },
    website: {
        type: String,
        required: false,
    },
    city: {
        type: String,
        required: false,
    },
    service: {
        type: String,
        required: false,
    },
    about: {
        type: String,
        required: false,
    },
    profile: {
        type: String,
        default: "https://res.cloudinary.com/dzo4husae/image/upload/v1733459922/zfyfbvwgfgshmahyvfyk.png",
    },
    documentVerified: {
        type: [String],
        default: null,
    },
    photo: {
        type: String,
        default: null,
    },
    address: {
        type: String,
        required: false,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: Object.values(user_1.USER_STATUS),
        default: user_1.USER_STATUS.ACTIVE,
    },
    approveStatus: {
        type: String,
        enum: Object.values(user_1.APPROVE_STATUS),
    },
    lastStatusChanged: {
        type: Date,
    },
    userReport: {
        type: String,
        enum: Object.values(user_1.USER_REPORT),
        default: user_1.USER_REPORT.NO_REPORT,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number], // [lng, lat]
            default: [0, 0],
        },
    },
    subscription: {
        type: String,
        default: user_1.SUBSCRIPTION_STATUS.INACTIVE,
        enum: Object.values(user_1.SUBSCRIPTION_STATUS),
    },
    isUserWaiting: {
        type: Boolean,
        default: false,
    },
    paymentStatus: {
        type: String,
        enum: ["paid", "unpaid", "expired"],
        default: "unpaid",
    },
    stripeAccountId: { type: String, default: null },
    authentication: {
        type: {
            isResetPassword: { type: Boolean, default: false },
            // Email OTP
            emailOTP: {
                code: { type: Number, default: null },
                expireAt: { type: Date, default: null },
            },
            // Phone OTP
            phoneOTP: {
                code: { type: Number, default: null },
                expireAt: { type: Date, default: null },
            },
        },
        select: 0,
    },
    accountInformation: {
        status: {
            type: Boolean,
            default: false,
        },
        stripeAccountId: {
            type: String,
        },
        externalAccountId: {
            type: String,
        },
        currency: {
            type: String,
        },
    },
    // pages: [{ type: String }],
    prefreances: [{ type: String }],
    // gender: {
    //   type: String,
    // },
    lastActive: { type: Date, default: new Date() },
    socketIds: { type: [String], default: [] },
    points: {
        type: Number,
        default: 0,
    },
    redeem: {
        type: Number,
        default: 0,
    },
    totalVisits: {
        type: Number,
        default: 0,
    },
    hasViewedReferral: {
        type: Boolean,
        default: false,
    },
    notificationSettings: {
        type: Object,
        default: {
            promotionalEmails: true,
            appNotifications: true,
            smsNotifications: true,
            referralNotifications: true,
            subscriptionNotifications: true,
            pushNotifications: true,
        },
    },
    // 🔹 Add these fields
    isRootMerchant: {
        type: Boolean,
        default: false,
    },
    isSubMerchant: {
        type: Boolean,
        default: false,
    },
    previousPasswords: [
        {
            hash: String,
            changedAt: Date
        }
    ],
    // build time error solve for user model
    pages: [String],
}, {
    timestamps: true,
});
userSchema.index({ location: "2dsphere" });
// Virtual id for JWT
userSchema.virtual("id").get(function () {
    return this._id.toHexString();
});
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $ne: null } } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $exists: true, $ne: null } } });
userSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $exists: true } } });
userSchema.index({ appleId: 1 }, { unique: true, partialFilterExpression: { appleId: { $exists: true } } });
// Virtual for fully verified
// userSchema.virtual("isFullyVerified").get(function () {
//   return this.emailVerified && this.phoneVerified;
// });
//exist user check
userSchema.statics.isExistUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield exports.User.findById(id);
    return isExist;
});
userSchema.statics.isExistUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield exports.User.findOne({ email });
    return isExist;
});
userSchema.statics.isExistUserByPhone = (phone) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield exports.User.findOne({ phone });
    return isExist;
});
//account check
userSchema.statics.isAccountCreated = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield exports.User.findById(id);
    return isUserExist.accountInformation.status;
});
//is match password
userSchema.statics.isMatchPassword = (password, hashPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.compare(password, hashPassword);
});
//check user
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // if (this.isNew) {
        //   // only check email uniqueness on new user
        //   const isExist = await User.findOne({ email: this.email });
        //   if (isExist) {
        //     return next(
        //       new ApiError(StatusCodes.BAD_REQUEST, "Email already exist!")
        //     );
        //   }
        // }
        // Hash password if modified
        if (this.isModified("password") && this.password) {
            this.password = yield bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
        }
        next();
    });
});
exports.User = (0, mongoose_1.model)("User", userSchema);
