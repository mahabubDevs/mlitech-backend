import { AuraBandle } from "./auraBundle.model";
import { IAuraBundle } from "./auraBundle.interface";
import { Subscription } from "../subscription/subscription.model";
import QueryBuilder from "../../../util/queryBuilder";
import { Purchase } from "../purchase/purchase.model";

// Create package (admin only)
const createPackage = async (payload: IAuraBundle) => {
  const newPackage = await AuraBandle.create(payload);
  return newPackage;
};





// import { AuraBandle } from "./auraBundle.model";
// import { Purchase } from "../purchase/purchase.model";

// // Existing functions ...
// // Create, Update, Delete, Toggle, GetSingle, GetAll

// // Update user AP after successful purchase
// const addUserPurchase = async (userId: string, packageId: string, platform: "ios" | "android", receipt: string) => {
//   // Find package
//   const pkg = await AuraBandle.findById(packageId);
//   if (!pkg) throw new Error("Package not found");

//   // Create purchase record
//   const purchase = await Purchase.create({
//     userId,
//     packageId,
//     platform,
//     receipt,
//     status: "success",
//   });

//   // Add credits/AP to user account
//   // Assuming you have a User model with `ap` field
//   const User = require("../user/user.model").User;
//   const user = await User.findById(userId);
//   if (!user) throw new Error("User not found");

//   user.ap = (user.ap || 0) + parseInt(pkg.totalap); // totalap stored as string
//   await user.save();

//   return purchase;
// };






// Update package
const updatePackage = async (id: string, payload: Partial<IAuraBundle>) => {
  const updated = await AuraBandle.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) throw new Error("Package not found");
  return updated;
};

// Delete package
const deletePackage = async (id: string) => {
  const deleted = await AuraBandle.findByIdAndDelete(id);
  if (!deleted) throw new Error("Package not found");
  return deleted;
};

// Toggle active status
const togglePackage = async (id: string) => {
  const pkg = await AuraBandle.findById(id);
  if (!pkg) throw new Error("Package not found");
  pkg.isActive = !pkg.isActive;
  await pkg.save();
  return pkg;
};

// Get single package
const getSinglePackage = async (id: string) => {
  const pkg = await AuraBandle.findById(id);
  if (!pkg) throw new Error("Package not found");
  return pkg;
};

// Get all packages + total users per package
const getAllPackages = async (query: any) => {
  const builder = new QueryBuilder(AuraBandle.find(), query)
    .search(['totalap'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const packages = await builder.modelQuery;

  // Count total users who bought each package
  const dataWithUserCount = await Promise.all(
    packages.map(async (pkg) => {
      const totalUsers = await Purchase.countDocuments({ packageId: pkg._id });
      return { ...pkg.toObject(), totalUsers };
    })
  );

  const pagination = await builder.getPaginationInfo();

  return { data: dataWithUserCount, ...pagination };
};


const addUserPurchase = async (userId: string, packageId: string, platform: "ios" | "android", receipt: string) => {
  const pkg = await AuraBandle.findById(packageId);
  if (!pkg) throw new Error("Package not found");

  const purchase = await Purchase.create({
    userId,
    packageId,
    platform,
    receipt,
    status: "success",
  });

  const User = require("../user/user.model").User;
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

user.balance = (user.balance || 0) + Number(pkg.totalap); // update balance field
  await user.save();

  return purchase;
};



export const AuraBundleService = {
  createPackage,
  updatePackage,
  deletePackage,
  togglePackage,
  getSinglePackage,
  getAllPackages,
  addUserPurchase
};
