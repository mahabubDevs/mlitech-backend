import { Push } from "./push.model";
import { IPushPayload} from "./push.interface";

import QueryBuilder from "../../../util/queryBuilder";
import { firebaseHelper } from "../../../helpers/firebaseHelper";
import { User } from "../user/user.model";
import admin from "../../../config/firebase";
import { DigitalCard } from "../customer/digitalCard/digitalCard.model";
import { Types } from "mongoose";
import { sendNotification } from "../../../helpers/notificationsHelper";
import { NotificationType } from "../notification/notification.model";
import { Sell } from "../mercent/mercentSellManagement/mercentSellManagement.model";
import { MerchantCustomer } from "../mercent/merchantCustomer/merchantCustomer.model";


// Send push (existing)


const sendNotificationToAllUsers = async (
  payload: IPushPayload,
  adminId: string
) => {
  const { sendType, title, body, country, tier, subscriptionType, status, city } = payload;

  try {
    console.log("[Notification] Payload received:", payload);
    console.log("[Notification] Admin ID:", adminId);

    const users2 = await User.find({}).select("firstName lastName").lean();
    console.log("[Notification] Total users in system:", users2.length);

    // users যারা fcmToken আছে
    const usersWithToken = await User.find({
      fcmToken: { $exists: true, $nin: [null, ""] },
    })
      .select("fcmToken")
      .lean();

    console.log("[Notification] Total users with fcmToken:", usersWithToken.length);

    // 1️⃣ Fetch all users who have fcmToken
    const allUsersWithToken = await User.find({
      fcmToken: { $exists: true, $ne: null },
    }).select("fcmToken _id role subscription status city country tier");

    console.log("[Notification] All users with fcmToken (before filter):", allUsersWithToken);

    // 2️⃣ Build filter
    const userFilter: any = { fcmToken: { $exists: true, $ne: null } };

    if (sendType === "MERCENT") userFilter.role = "MERCENT";
    else if (sendType === "USER") userFilter.role = "USER";

    if (city && (sendType === "MERCENT" || sendType === "USER")) {
      userFilter.city = { $regex: `^${city}$`, $options: "i" };
    }
    if (country) userFilter.country = { $regex: `^${country}$`, $options: "i" };
    if (tier) userFilter.tier = tier.toUpperCase();
    if (subscriptionType)
      userFilter.subscription = { $regex: `^${subscriptionType}$`, $options: "i" };
    if (status)
      userFilter.status = { $regex: `^${status}$`, $options: "i" };

    console.log("[Notification] Final user filter:", userFilter);

    // 3️⃣ Fetch users after filter
    const filteredUsers = await User.find(userFilter).select("fcmToken _id");

    console.log("[Notification] Users after applying filter:", filteredUsers);

    const tokens: string[] = [];
    const userIds: Types.ObjectId[] = [];

    filteredUsers.forEach((u) => {
      if (u.fcmToken) {
        tokens.push(u.fcmToken);
        userIds.push(u._id);
      }
    });

    console.log("[Notification] Tokens to send:", tokens);

    if (tokens.length === 0) {
      return {
        sentCount: 0,
        failedCount: 0,
        message: "No users matched the criteria",
      };
    }

    // 4️⃣ Send push via Firebase
    const message = { notification: { title, body }, tokens };
    const response = await admin.messaging().sendEachForMulticast(message);

    // 5️⃣ Save notification in DB
    await sendNotification({
      userIds,
      title,
      body,
      type: NotificationType.SYSTEM,
      metadata: { sentBy: adminId },
      channel: { socket: true, push: true },
    });

    console.log("[Notification] Notification records created");

    // 6️⃣ Log successful and failed tokens
    const successfulTokens: string[] = [];
    const failedTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
  if (resp.success) {
    successfulTokens.push(tokens[idx]);
  } else {
    failedTokens.push(tokens[idx]);

    // 🔥 IMPORTANT DEBUG (এখানেই add করবা)
    console.log("❌ Failed Token:", tokens[idx]);
    console.log("🔥 Error Code:", resp.error?.code);
    console.log("🔥 Error Message:", resp.error?.message);
  }
});

    console.log("[Notification] Successfully sent tokens:", successfulTokens);
    console.log("[Notification] Failed tokens:", failedTokens);

    // ❌ DELETE PART REMOVED

    return {
      sentCount: response.successCount,
      failedCount: response.failureCount,
      successfulTokens,
      failedTokens,
    };
  } catch (error) {
    console.error("[Notification] Error sending push:", error);
    throw new Error("Failed to send push notification");
  }
};




const sendMerchantPromotion = async (payload: any, merchantId: string) => {
  const { message, image, target, filters } = payload;

  console.log("=================================================");
  console.log("🚀 sendMerchantPromotion START");
  console.log("🧾 Merchant ID:", merchantId);
  console.log("=================================================");

  let users: any[] = [];

  const allCustomer = filters?.segment === "all_customer";

  if (allCustomer) {
    const cards = await DigitalCard.find({ merchantId })
      .populate("userId", "fcmToken location createdAt isVIP")
      .select("userId availablePoints")
      .lean();

    const userIds = cards
      .map((c: any) => c.userId?._id)
      .filter(Boolean);

    const sells = await Sell.find({
      merchantId,
      userId: { $in: userIds },
      status: "completed",
    }).lean();

    const sellMap: Record<string, any[]> = {};
    sells.forEach((sell: any) => {
      const uid = sell.userId.toString();
      if (!sellMap[uid]) sellMap[uid] = [];
      sellMap[uid].push(sell);
    });

    const now = new Date();
    const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const avgSpend = 1000;

    users = cards
      .map((c: any) => {
        const user = c.userId;

        if (!user) {
          console.log("❌ Missing user in card:", c);
          return null;
        }

        const userId = user?._id?.toString();
        if (!userId) return null;

        const userSells = sellMap[userId] || [];

        const totalSpend = userSells.reduce(
          (sum, s) => sum + (s.discountedBill || 0),
          0
        );

        const last6MonthsPurchases = userSells.filter(
          (s) => new Date(s.createdAt) >= last6Months
        ).length;

        let segment = "new_customer";

        if (last6MonthsPurchases >= 20 || totalSpend >= 3 * avgSpend) {
          segment = "vip_customer";
        } else if (
          last6MonthsPurchases >= 5 ||
          totalSpend >= 1.5 * avgSpend
        ) {
          segment = "loyal_customer";
        } else if (
          userSells.length >= 2 &&
          last6MonthsPurchases < 5
        ) {
          segment = "returning_customer";
        }

        return {
          userId: user._id,
          fcmToken: user.fcmToken,
          location: user.location,
          availablePoints: c.availablePoints ?? 0,
          segment,
        };
      })
      .filter(Boolean);
  } else {
    const merchantCustomers = await MerchantCustomer.find({
      merchantId,
      segment: filters.segment,
    })
      .populate("customerId", "fcmToken location createdAt isVIP")
      .select("customerId points segment")
      .lean();

    users = merchantCustomers
      .map((mc: any) => {
        if (!mc.customerId) {
          console.log("❌ Missing customerId:", mc);
          return null;
        }

        return {
          userId: mc.customerId._id,
          fcmToken: mc.customerId.fcmToken,
          location: mc.customerId.location,
          availablePoints: mc.points ?? 0,
          segment: mc.segment,
        };
      })
      .filter(Boolean);
  }

  /* ================= FILTER ================= */

  let skippedNoToken = 0;
  let skippedPoints = 0;
  let skippedRadius = 0;
  let eligibleUsers = 0;

  const merchantLocation = filters?.merchantLocation;

  const eligibleUsersData = users
    .filter((u) => {
      if (!u.fcmToken) {
        skippedNoToken++;
        return false;
      }

      if (target?.type === "points" && filters?.minPoints !== undefined) {
        if (u.availablePoints < filters.minPoints) {
          skippedPoints++;
          return false;
        }
      }

      if (
        typeof filters?.radius === "number" &&
        filters.radius !== Infinity &&
        merchantLocation?.coordinates &&
        u.location?.coordinates
      ) {
        const [userLng, userLat] = u.location.coordinates;
        const [centerLng, centerLat] = merchantLocation.coordinates;

        const distance = getDistanceFromLatLonInKm(
          Number(userLat),
          Number(userLng),
          Number(centerLat),
          Number(centerLng)
        );

        if (distance > filters.radius) {
          skippedRadius++;
          return false;
        }
      }

      eligibleUsers++;
      return true;
    })
    .map((u) => ({
      userId: u.userId,
      token: u.fcmToken,
    }));

  const tokens = eligibleUsersData.map((u) => u.token);
  const finalUserIds = eligibleUsersData.map((u) => u.userId);

  console.log("📊 Eligible Users:", eligibleUsers);

  if (tokens.length === 0) {
    return { sentCount: 0, failedCount: 0, message: "No customers matched" };
  }

  /* ================= FIREBASE ================= */

  const firebaseMessage = {
    notification: {
      title: "Promotion",
      body: message,
      image,
    },
    data: {
      type: "promotion",
      merchantId: merchantId.toString(),
    },
    tokens,
  };

  const response = await admin
    .messaging()
    .sendEachForMulticast(firebaseMessage);

  await sendNotification({
    userIds: finalUserIds,
    title: "Promotion",
    body: message,
    type: NotificationType.PROMOTION,
    metadata: { merchantId },
    attachments: image ? [image] : [],
    channel: { socket: true, push: false },
  });

  return {
    sentCount: response.successCount,
    failedCount: response.failureCount,
  };
};


// Helper functions
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}




// Get all push notifications (Admin)
// const getAllPushesFromDB = async (query: any) => {
//   let baseQuery = Push.find({});
//   const qb = new QueryBuilder(baseQuery, query);
//   qb.search(["title", "body", "state"]).filter().sort().paginate().fields();

//   const data = await qb.modelQuery.lean();
//   const pagination = await qb.getPaginationInfo();
//   return { data, pagination };
// };

export const PushService = {
  sendNotificationToAllUsers,
  sendMerchantPromotion
  // getAllPushesFromDB,
};
