// src/modules/package/package.service.ts

import stripe from "../../../config/stripe";
import QueryBuilder from "../../../util/queryBuilder";
import { Subscription } from "../subscription/subscription.model";
import { IPackage } from "./aurashop.interface";
import { Package } from "./aurashop.module";


// const createPackage= async (payload: IPackage) => {
//     // 1️⃣ Create Stripe Product
//     const product = await stripe.products.create({
//       name: payload.title,
//       description: payload.description,
//     });

//     // Map duration to interval
//     let interval: 'day' | 'week' | 'month' | 'year' = 'month';
//     let intervalCount = 1;
//     switch (payload.duration) {
//       case "1 day": interval = "day"; break;
//       case '1 week': interval = 'week'; break;
//       case '1 month': interval = 'month'; break;
//       case '3 months': interval = 'month'; intervalCount = 3; break;
//       case '6 months': interval = 'month'; intervalCount = 6; break;
//       case '1 year': interval = 'year'; break;
//       default: interval = 'month';
//     }

//     // 2️⃣ Create Stripe Price
//     const price = await stripe.prices.create({
//       product: product.id,
//       unit_amount: Math.round(payload.price * 100),
//       currency: "usd",
//       recurring: { interval, interval_count: intervalCount },
//     });

//     // 3️⃣ Save in DB
//     const newPackage = await Package.create({
//       ...payload,
//       productId: product.id,
//       priceId: price.id,
//     });

//     return newPackage;
//   };

const updatePackage = async (id: string, payload: Partial<IPackage>) => {
  const updated = await Package.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) throw new Error("Package not found");
  return updated;
};

const deletePackage = async (id: string) => {
  const deleted = await Package.findByIdAndDelete(id);
  if (!deleted) throw new Error("Package not found");
  return deleted;
};

const togglePackage = async (id: string) => {
  const pkg = await Package.findById(id);
  if (!pkg) throw new Error("Package not found");
  pkg.isActive = !pkg.isActive;
  await pkg.save();
  return pkg;
};

const getSinglePackage = async (id: string) => {
  const pkg = await Package.findById(id);
  if (!pkg) throw new Error("Package not found");
  return pkg;
};

const getAllPackages = async (query: any) => {
  console.log("Raw query:", query);
  const builder = new QueryBuilder(Package.find(), query)
    .search(['title', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const packages = await builder.modelQuery;

console.log("Mongoose query filter:", builder.modelQuery.getFilter());

  const pagination = await builder.getPaginationInfo();

  // add total users per package
  const dataWithUserCount = await Promise.all(
    packages.map(async (pkg) => {
      const totalUsers = await Subscription.countDocuments({ packageId: pkg._id });
      return { ...pkg.toObject(), totalUsers };
    })
  );

  return { data: dataWithUserCount, ...pagination };
};

export const AuraSubscriptionService = {
  // createPackage,
   updatePackage,
  deletePackage,
  togglePackage,
  getSinglePackage,
  getAllPackages,
}
