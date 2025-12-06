import mongoose, { Schema, Document } from "mongoose";
import { IContactUs } from "./contactUs.interface";


export interface IContactUsDocument extends IContactUs, Document {}

const contactUsSchema = new Schema<IContactUsDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

export const ContactUs = mongoose.model<IContactUsDocument>("ContactUs", contactUsSchema);
