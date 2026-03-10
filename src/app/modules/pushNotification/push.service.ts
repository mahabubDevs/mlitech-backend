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

    // 1️⃣ Base filter: Only users with fcmToken
    const userFilter: any = { fcmToken: { $exists: true, $ne: null },"notificationSettings.pushNotifications": true };

    // 2️⃣ Role filter based on sendType
    if (sendType === "MERCENT") userFilter.role = "MERCENT";
    else if (sendType === "USER") userFilter.role = "USER";
    // if sendType is ALL, no role filter (send to all users)

    // ✅ City filter only for merchant or user
    if (city && (sendType === "MERCENT" || sendType === "USER")) {
      userFilter.city = { $regex: `^${city}$`, $options: "i" };
    }

    // 3️⃣ Optional filters (same as before)
    if (country) userFilter.country = { $regex: `^${country}$`, $options: "i" };
    if (tier) userFilter.tier = tier.toUpperCase();
    if (subscriptionType)
      userFilter.subscription = { $regex: `^${subscriptionType}$`, $options: "i" };
    if (status) userFilter.status = { $regex: `^${status}$`, $options: "i" };

    console.log("[Notification] Final user filter:", userFilter);

    // 4️⃣ Fetch users
    const users = await User.find(userFilter).select("fcmToken _id");
    console.log(`[Notification] Users fetched: ${users.length}`);

    const tokens: string[] = [];
    console.log("[Notification] Processing user tokens...", users);
    const userIds: Types.ObjectId[] = [];

    users.forEach((u) => {
      if (u.fcmToken) {
        tokens.push(u.fcmToken);
        userIds.push(u._id);
      }
    });

    if (tokens.length === 0) {
      return {
        sentCount: 0,
        failedCount: 0,
        message: "No users matched the criteria",
      };
    }

    // 5️⃣ Send push via Firebase
    const message = { notification: { title, body }, tokens };
    const response = await admin.messaging().sendEachForMulticast(message);

    // 6️⃣ Save notification in DB
    await sendNotification({
      userIds,
      title,
      body,
      type: NotificationType.SYSTEM,
      metadata: { sentBy: adminId },
      channel: { socket: true, push: true },
    });
    console.log("[Notification] Notification records created");

    // 7️⃣ Remove invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) failedTokens.push(tokens[idx]);
      });

      if (failedTokens.length > 0) {
        await User.updateMany(
          { fcmToken: { $in: failedTokens } },
          { $unset: { fcmToken: "" } }
        );
        console.log(`[Notification] Removed ${failedTokens.length} invalid tokens`);
      }
    }

    return {
      sentCount: response.successCount,
      failedCount: response.failureCount,
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

  /* ============================================================
     1️⃣ FETCH USERS
  ============================================================ */

  let users: any[] = [];

  const allCustomer = filters?.segment === "all_customer";

  if (allCustomer) {
    // All users → use DigitalCard + Sell for manual segment
    const cards = await DigitalCard.find({ merchantId })
      .populate("userId", "fcmToken location createdAt isVIP")
      .select("userId availablePoints")
      .lean();

    const userIds = cards.map((c: any) => c.userId?._id).filter(Boolean);

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
    const avgSpend = 1000; // default baseline

    users = cards.map((c: any) => {
      const user = c.userId;
      const userId = user?._id.toString();

      const userSells = sellMap[userId] || [];
      const totalSpend = userSells.reduce((sum, s) => sum + (s.discountedBill || 0), 0);
      const last6MonthsPurchases = userSells.filter(s => new Date(s.createdAt) >= last6Months).length;

      // Manual segment calculation
      let segment = "new_customer";
      if (last6MonthsPurchases >= 20 || totalSpend >= 3 * avgSpend) {
        segment = "vip_customer";
      } else if (last6MonthsPurchases >= 5 || totalSpend >= 1.5 * avgSpend) {
        segment = "loyal_customer";
      } else if (userSells.length >= 2 && last6MonthsPurchases < 5) {
        segment = "returning_customer";
      }

      return {
        userId: user._id,
        fcmToken: user.fcmToken,
        location: user.location,
        availablePoints: c.availablePoints ?? 0,
        segment,
      };
    });
  } else {
    // Specific segment → use MerchantCustomer schema
    const merchantCustomers = await MerchantCustomer.find({
      merchantId,
      segment: filters.segment,
    })
      .populate("customerId", "fcmToken location createdAt isVIP")
      .select("customerId points segment")
      .lean();

    users = merchantCustomers.map((mc: any) => ({
      userId: mc.customerId._id,
      fcmToken: mc.customerId.fcmToken,
      location: mc.customerId.location,
      availablePoints: mc.points ?? 0,
      segment: mc.segment,
    }));
  }

  /* ============================================================
     2️⃣ FILTER USERS (POINTS / RADIUS / FCM)
  ============================================================ */

  let skippedNoToken = 0;
  let skippedPoints = 0;
  let skippedRadius = 0;
  let eligibleUsers = 0;

  const merchantLocation = filters?.merchantLocation;

  const eligibleUsersData = users
    .filter(u => {
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
    .map(u => ({
      userId: u.userId,
      token: u.fcmToken,
    }));

  const tokens = eligibleUsersData.map(u => u.token);
  const finalUserIds = eligibleUsersData.map(u => u.userId);

  console.log("=================================================");
  console.log("📌 FILTER SUMMARY");
  console.log("❌ No FCM:", skippedNoToken);
  console.log("❌ Points:", skippedPoints);
  console.log("❌ Radius:", skippedRadius);
  console.log("✅ Eligible:", eligibleUsers);
  console.log("=================================================");

  if (tokens.length === 0) {
    return { sentCount: 0, failedCount: 0, message: "No customers matched" };
  }

  /* ============================================================
     3️⃣ SEND NOTIFICATION
  ============================================================ */
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

  const response = await admin.messaging().sendEachForMulticast(firebaseMessage);

  await sendNotification({
    userIds: finalUserIds,
    title: "Promotion",
    body: message,
    type: NotificationType.PROMOTION,
    metadata: { merchantId },
    attachments: image ? [image] : [],
    channel: {
      socket: true,
      push: false,
    },
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
