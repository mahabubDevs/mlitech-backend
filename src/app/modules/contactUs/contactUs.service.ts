

import mongoose from "mongoose";
import { IContactUs } from "./contactUs.interface";
import { ContactUs, IContactUsDocument } from "./contactUs.model";

const createContact = async (data: IContactUs): Promise<IContactUsDocument> => {
  const contact = new ContactUs(data);
  return await contact.save();
};

const getAllContacts = async (): Promise<IContactUsDocument[]> => {
  const contacts = await ContactUs.find().sort({ createdAt: -1 });
  return contacts;
};

export const ContactService = {
  createContact,
  getAllContacts,
};
