import { Buy } from "./buy.model";
import { User } from "../user/user.model";
import { CallBandle } from "../shopCallBundle/callBundle.model";

// User buys AP-based minute package
const buyPackage = async (userId: string, packageId: string) => {
  // ১. প্যাকেজ খুঁজে বের করা
  const pkg = await CallBandle.findById(packageId);
  if (!pkg || !pkg.isActive) throw new Error("Package not available");

  // ২. ইউজার খুঁজে বের করা
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  console.log("User Balance:", user.balance, "Package AP:", pkg.totalap);

  // ৩. balance এবং availableTime number হিসেবে নিন
  const balance: number = Number(user.balance ?? 0);
  const availableTime: number = Number(user.availableTime ?? 0);

  // ৪. প্যাকেজের totalap এবং totaltime number হিসেবে নিন
  const packageAp: number = Number(pkg.totalap ?? 0);
  const packageTime: number = Number(pkg.totaltime ?? 0);

  // ৫. Balance check
  if (balance < packageAp) throw new Error("Not enough AP balance");

  // ৬. AP deduct এবং মিনিট যোগ করা
  user.balance = balance - packageAp;
  user.availableTime = availableTime + packageTime;

  // ৭. Save user
  await user.save();

  // ৮. Record the purchase
  const purchase = await Buy.create({
    userId,
    packageId,
    minutesAdded: packageTime,
    apSpent: packageAp,
  });

  return purchase;
};

// Get all purchases of a user
const getUserPurchases = async (userId: string) => {
  const purchases = await Buy.find({ userId })
    .populate("packageId", "totaltime totalap")
    .sort({ createdAt: -1 });

  return purchases;
};

export const BuyService = {
  buyPackage,
  getUserPurchases,
};
