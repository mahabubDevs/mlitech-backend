import { Tier } from "./tier.model";
import { ITier } from "./tier.interface";

const createTierToDB = async (payload: Partial<ITier>): Promise<ITier> => {
  const tier = new Tier(payload);
  return tier.save();
};

const updateTierToDB = async (id: string, payload: Partial<ITier>): Promise<ITier | null> => {
  return Tier.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

  const getTierFromDB = async (adminId?: string): Promise<ITier[]> => {
    const query: any = {};
    if (adminId) query.admin = adminId;
    return Tier.find(query).sort({ pointsThreshold: 1 });
  };

const getSingleTierFromDB = async (id: string): Promise<ITier | null> => {
  return Tier.findById(id);
};

const deleteTierToDB = async (id: string): Promise<ITier | null> => {
  return Tier.findByIdAndDelete(id);
};

export const TierService = {
  createTierToDB,
  updateTierToDB,
  getTierFromDB,
  getSingleTierFromDB,
  deleteTierToDB,
};
