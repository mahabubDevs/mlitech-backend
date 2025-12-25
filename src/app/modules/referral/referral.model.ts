import { model, Schema } from "mongoose";
import { IReferral } from "./referral.interface";

const referralSchema = new Schema<IReferral>(
    {
        referrer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        referredUser: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
    },
    { timestamps: true }
);

const Referral = model<IReferral>("Referral", referralSchema);
export default Referral;
