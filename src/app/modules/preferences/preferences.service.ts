// src/app/modules/userPreference/userPreference.service.ts
import { UserPreference } from "./preferences.model";

const createPreference = async (userId: string, payload: any) => {
  const exists = await UserPreference.findOne({ userId });
  if (exists) {
    throw new Error("Preference already exists, use update instead.");
  }
  const doc = await UserPreference.create({ ...payload, userId });
  return doc;
};

const getPreference = async (userId: string) => {
  return await UserPreference.findOne({ userId });
};

const updatePreference = async (userId: string, payload: any) => {
  return await UserPreference.findOneAndUpdate(
    { userId },
    { $set: payload },
    { new: true, upsert: true }
  );
};

const deletePreference = async (userId: string) => {
  return await UserPreference.findOneAndDelete({ userId });
};

export const UserPreferenceService = {
  createPreference,
  getPreference,
  updatePreference,
  deletePreference,
};
