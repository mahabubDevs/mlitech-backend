// import { Schema, model, Types } from "mongoose";
// import { MerchantCustomer } from "../merchantCustomer/merchantCustomer.model";

// const sellSchema = new Schema({
//   merchantId: { type: Types.ObjectId, ref: "User", required: true },
//   userId: { type: Types.ObjectId, ref: "User", required: true },
//   digitalCardId: { type: Types.ObjectId, ref: "DigitalCardPromotin", required: true },
//   promotionId: { type: Types.ObjectId, ref: "PromotionMercent", required: false },
//   totalBill: { type: Number, required: true },
//   discountedBill: { type: Number, required: true },
//   pointsEarned: { type: Number, required: true },
//   pointRedeemed: { type: Number, required: false },
//   status: { type: String, enum: ["completed", "pending","rejected"], default: "pending" },
// }, { timestamps: true });


// sellSchema.post("save", async function (doc) {
//   if (doc.status !== "completed") return;

//   await MerchantCustomer.findOneAndUpdate(
//     {
//       merchantId: doc.merchantId,
//       customerId: doc.userId,
//     },
//     {
//       $inc: {
//         totalSpend: doc.totalBill,
//         totalOrders: 1,
//         points: doc.pointsEarned || 0,
//       },
//       $set: {
//         lastPurchaseAt: new Date(),
//       },
//     },
//     { upsert: true, new: true }
//   );
// });

// export const Sell = model("Sell", sellSchema);




import { Schema, model, Types } from "mongoose";
import { MerchantCustomer } from "../merchantCustomer/merchantCustomer.model";

const sellSchema = new Schema({
  merchantId: { type: Types.ObjectId, ref: "User", required: true },
  userId: { type: Types.ObjectId, ref: "User", required: true },
  digitalCardId: { type: Types.ObjectId, ref: "DigitalCardPromotin", required: true },
  promotionIds: [
  {
    type: Types.ObjectId,
    ref: "PromotionMercent",
  }
],

  totalBill: { type: Number, required: true },
  discountedBill: { type: Number, required: true },
  pointsEarned: { type: Number, required: true },
  pointRedeemed: { type: Number, required: false },
  status: { type: String, enum: ["completed", "pending","rejected","expired"], default: "pending" },
  approvalExpiresAt: {
  type: Date,
},
}, { timestamps: true });

// ======= Post-save hook =======
sellSchema.post("save", async function (doc) {
  if (doc.status !== "completed") return;

  // 1️⃣ Update MerchantCustomer stats
  const updatedCustomer = await MerchantCustomer.findOneAndUpdate(
    {
      merchantId: doc.merchantId,
      customerId: doc.userId,
    },
    {
      $inc: {
        totalSpend: doc.totalBill,
        totalOrders: 1,
        points: doc.pointsEarned || 0,
      },
      $set: {
        lastPurchaseAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // 2️⃣ Recalculate segment
  if (updatedCustomer) {
    const { totalOrders, totalSpend } = updatedCustomer;

    // Timeframes
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);

    // Last 6 months purchases
    const last6MonthsPurchases = await model("Sell").find({
      merchantId: doc.merchantId,
      userId: doc.userId,
      status: "completed",
      createdAt: { $gte: sixMonthsAgo },
    }).countDocuments();

    // Last 12 months spend
    const last12MonthsSpend = await model("Sell").find({
      merchantId: doc.merchantId,
      userId: doc.userId,
      status: "completed",
      createdAt: { $gte: twelveMonthsAgo },
    }).then(sells => sells.reduce((sum, s) => sum + s.totalBill, 0));

    const avgSpend = 10000; // Default average spend

    let segment: "new_customer" | "returning_customer" | "loyal_customer" | "vip_customer" | "all_customer";

    // ----------------------
    // 1️⃣ VIP Customer
    // ----------------------
    if (last6MonthsPurchases >= 20 || last12MonthsSpend >= 3 * avgSpend) {
      segment = "vip_customer";
    }

    // ----------------------
    // 2️⃣ Loyal Customer
    // ----------------------
    else if (
      last6MonthsPurchases >= 5 ||
      totalOrders >= 3 || // Approximate 3 consecutive months of activity
      totalSpend >= 1.5 * avgSpend
    ) {
      segment = "loyal_customer";
    }

    // ----------------------
    // 3️⃣ Returning Customer
    // ----------------------
    else if (totalOrders >= 2 && last6MonthsPurchases < 5) {
      segment = "returning_customer";
    }

    // ----------------------
    // 4️⃣ New Customer
    // ----------------------
    else {
      segment = "new_customer";
    }

    updatedCustomer.segment = segment;
    await updatedCustomer.save();
  }
});

export const Sell = model("Sell", sellSchema);
