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


// Send push (existing)


const sendNotificationToAllUsers = async (
  payload: IPushPayload,
  adminId: string
) => {
  const { sendType, title, body, country, tier, subscriptionType, status } = payload;

  try {
    console.log("[Notification] Payload received:", payload);
    console.log("[Notification] Admin ID:", adminId);

    // 1️⃣ Base filter: Only users with fcmToken
    const userFilter: any = { fcmToken: { $exists: true, $ne: null } };

    // 2️⃣ Role filter based on sendType
    if (sendType === "MERCENT") userFilter.role = "MERCENT";
    else if (sendType === "USER") userFilter.role = "USER";
    // if sendType is ALL, no role filter (send to all users)

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
      channel: { socket: false, push: true },
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
     1️⃣ FETCH DIGITAL CARD USERS
  ============================================================ */

  const cards = await DigitalCard.find({ merchantId })
    .populate("userId", "fcmToken location createdAt isVIP")
    .select("userId availablePoints")
    .lean();

  console.log(`📌 Total customers fetched: ${cards.length}`);

  const userIds = cards.map((c: any) => c.userId?._id).filter(Boolean);

  /* ============================================================
     2️⃣ FETCH ALL SELLS FOR THIS MERCHANT (IMPORTANT)
  ============================================================ */

  const sells = await Sell.find({
    merchantId,
    userId: { $in: userIds },
    status: "completed",
  }).lean();

  console.log(`📊 Total completed sells found: ${sells.length}`);

  /* ============================================================
     3️⃣ GROUP SELLS BY USER
  ============================================================ */

  const sellMap: Record<string, any[]> = {};

  sells.forEach((sell: any) => {
    const uid = sell.userId.toString();
    if (!sellMap[uid]) sellMap[uid] = [];
    sellMap[uid].push(sell);
  });

  /* ============================================================
     4️⃣ FILTER USERS
  ============================================================ */

  let skippedNoToken = 0;
  let skippedPoints = 0;
  let skippedSegment = 0;
  let skippedRadius = 0;
  let eligibleUsers = 0;

  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

  const avgSpend = 1000; // later dynamic

  const eligibleUsersData = cards
    .filter((c: any) => {
      const user = c.userId;
      const userId = user?._id?.toString();

      if (!user?.fcmToken) {
        skippedNoToken++;
        return false;
      }

      /* =========================
         POINT FILTER
      ========================== */

      if (target?.type === "points" && filters?.minPoints !== undefined) {
        if ((c.availablePoints ?? 0) < filters.minPoints) {
          skippedPoints++;
          return false;
        }
      }

      /* =========================
         SELL DATA
      ========================== */

      const userSells = sellMap[userId] || [];
      const totalPurchases = userSells.length;
      const totalSpend = userSells.reduce(
        (sum, s) => sum + (s.discountedBill || 0),
        0
      );

      const sellsLast90Days = userSells.filter(
        (s) => new Date(s.createdAt) >= last90Days
      );

      const sellsLast6Months = userSells.filter(
        (s) => new Date(s.createdAt) >= last6Months
      );

      /* =========================
         SEGMENT CALCULATION
      ========================== */

      let segment = "all_customer";

      // 4️⃣ VIP
      if (
        user.isVIP === true ||
        sellsLast6Months.length >= 20 ||
        totalSpend >= 3 * avgSpend
      ) {
        segment = "vip_customer";
      }

      // 3️⃣ LOYAL
      else if (
        sellsLast6Months.length >= 5 ||
        totalSpend >= 1.5 * avgSpend
      ) {
        segment = "loyal_customer";
      }

      // 2️⃣ RETURNING
      else if (
        totalPurchases >= 2 &&
        sellsLast6Months.length < 5 &&
        sellsLast90Days.length > 0
      ) {
        segment = "returning_customer";
      }

      // 1️⃣ NEW
      else if (
        user.createdAt &&
        new Date(user.createdAt) >= last30Days &&
        (totalPurchases === 0 || totalPurchases === 1)
      ) {
        segment = "new_customer";
      }

      /* =========================
         SEGMENT FILTER
      ========================== */

      if (
        filters?.segment &&
        filters.segment !== "all_customer" &&
        filters.segment !== segment
      ) {
        skippedSegment++;
        return false;
      }

      /* =========================
         RADIUS FILTER
      ========================== */

      if (
        typeof filters?.radius === "number" &&
        filters.radius !== Infinity &&
        filters.merchantLocation?.coordinates &&
        user.location?.coordinates
      ) {
        const [userLng, userLat] = user.location.coordinates;
        const [centerLng, centerLat] =
          filters.merchantLocation.coordinates;

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
    .map((c: any) => ({
      userId: c.userId._id,
      token: c.userId.fcmToken,
    }));

  const tokens = eligibleUsersData.map((u) => u.token);
  const finalUserIds = eligibleUsersData.map((u) => u.userId);

  console.log("=================================================");
  console.log("📌 FILTER SUMMARY");
  console.log("❌ No FCM:", skippedNoToken);
  console.log("❌ Points:", skippedPoints);
  console.log("❌ Segment:", skippedSegment);
  console.log("❌ Radius:", skippedRadius);
  console.log("✅ Eligible:", eligibleUsers);
  console.log("=================================================");

  if (tokens.length === 0) {
    return { sentCount: 0, failedCount: 0, message: "No customers matched" };
  }

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

  const response =
    await admin.messaging().sendEachForMulticast(firebaseMessage);

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
