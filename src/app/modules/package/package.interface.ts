import { Model, Types } from "mongoose";

export type IPackage = {
    title: string;
    description: string;
    price: number;
    duration: '1 month' | '3 months' | '6 months' | '1 year';
    paymentType: 'Monthly' | 'Yearly';
    features: [{ type: String }],
    productId: string; // Stripe product id
    priceId: string;   // Stripe price id
    loginLimit: number;
    paymentLink: string;
    status?: 'Active' | 'Delete';
    createdBy: Types.ObjectId;
    payoutAccountId?: string;
    admin: Types.ObjectId;
};


export type PackageModel = Model<IPackage, Record<string, unknown>>;