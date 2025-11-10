import { model, Schema } from "mongoose";
import { USER_REPORT, USER_ROLES, USER_STATUS } from "../../../enums/user";
import { IUser, UserModal } from "./user.interface";
import bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";
import { boolean, object } from "zod";

const userSchema = new Schema<IUser, UserModal>(
    {
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
        fcmToken: {
          type: String,
          
        },
        referenceId: {
          type: String,
          required: false,
        },
        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.USER,
            required: false,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            select: 0,
            minlength: 8,
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
            default: 'https://res.cloudinary.com/dzo4husae/image/upload/v1733459922/zfyfbvwgfgshmahyvfyk.png',
        },
        documentVerified: {
            type: [String],
            default: null,
        },
        photo: {
            type: String,
            default: null,
        },
        
        
        verified: {
            type: Boolean,
            default: false,
        },
        status: {
           type: String,
           enum: Object.values(USER_STATUS),
           default: USER_STATUS.ACTIVE
        },
        userReport : {
          type: String,
          enum: Object.values(USER_REPORT),
          default: USER_REPORT.NO_REPORT,
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
            default: false
        },
        stripeAccountId: { type: String, default: null },

    


        authentication: {
            type: {
                isResetPassword: { type: Boolean, default: false },

                // Email OTP
                emailOTP: {
                code: { type: Number, default: null },
                expireAt: { type: Date, default: null }
                },

                // Phone OTP
                phoneOTP: {
                code: { type: Number, default: null },
                expireAt: { type: Date, default: null }
                }
            },
            select: 0
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
            }
        },
        // pages: [{ type: String }],
        
      prefreances: [
        { type: String }
      ]
     ,
      
      // gender: {
      //   type: String,
      // },
   
      lastActive: { type: Date, default: new Date() },
    },
    {
        timestamps: true
    }
)

userSchema.index({ location: "2dsphere" });
// Virtual id for JWT
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Virtual for fully verified

// userSchema.virtual("isFullyVerified").get(function () {
//   return this.emailVerified && this.phoneVerified;
// });
//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
    const isExist = await User.findById(id);
    return isExist;
};
  
userSchema.statics.isExistUserByEmail = async (email: string) => {
    const isExist = await User.findOne({ email });
    return isExist;
};
  
//account check
userSchema.statics.isAccountCreated = async (id: string) => {
    const isUserExist:any = await User.findById(id);
    return isUserExist.accountInformation.status;
};
  
//is match password
userSchema.statics.isMatchPassword = async ( password: string, hashPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashPassword);
};
  
//check user
userSchema.pre('save', async function (this: any, next) {
    if (this.isNew) {
        // only check email uniqueness on new user
        const isExist = await User.findOne({ email: this.email });
        if (isExist) {
            return next(new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!'));
        }
    }

    // Hash password if modified
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, Number(config.bcrypt_salt_rounds));
    }

    next();
});
export const User = model<IUser, UserModal>("User", userSchema)