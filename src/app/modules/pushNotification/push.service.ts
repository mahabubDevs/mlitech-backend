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
  console.log("🧾 Payload received:", JSON.stringify(payload, null, 2));
  console.log("=================================================");

  const cards = await DigitalCard.find({ merchantId })
    .populate("userId", "fcmToken location totalPurchases totalSpend purchases")
    .select("userId availablePoints")
    .lean();

  console.log(`📌 Total customers fetched from DB: ${cards.length}`);

  let skippedNoToken = 0;
  let skippedPoints = 0;
  let skippedSegment = 0;
  let skippedRadius = 0;
  let eligibleUsers = 0;

  const eligibleUsersData = cards
    .filter((c: any, index: number) => {
      const user = c.userId;

      console.log("-------------------------------------------------");
      console.log(`👤 Checking customer #${index + 1}`);
      console.log("User ID:", user?._id);
      console.log("Available Points:", c.availablePoints);

      // ❌ No FCM token
      if (!user?.fcmToken) {
        skippedNoToken++;
        console.log("❌ Skipped: No FCM token");
        return false;
      }

      // ❌ Points filter
      if (target?.type === "points" && filters?.minPoints !== undefined) {
        if ((c.availablePoints ?? 0) < filters.minPoints) {
          skippedPoints++;
          console.log(
            `❌ Skipped: Points too low (${c.availablePoints} < ${filters.minPoints})`
          );
          return false;
        }
      }

      // 🧠 Segment calculation
      let segment = "all_customer";
      const totalPurchases = user.totalPurchases || 0;
      const purchases = user.purchases || [];
      const last6MonthsPurchases = purchases.filter(
        (p: any) =>
          new Date(p.createdAt) >=
          new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
      );
      const totalSpend = user.totalSpend || 0;
      const avgSpend = 1000;

      if (
        totalPurchases === 0 ||
        (totalPurchases === 1 &&
          purchases[0]?.createdAt >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      ) {
        segment = "new_customer";
      } else if (totalPurchases >= 2 && last6MonthsPurchases.length < 5) {
        segment = "returning_customer";
      } else if (last6MonthsPurchases.length >= 5 || totalSpend >= 1.5 * avgSpend) {
        segment = "loyal_customer";
      } else if (last6MonthsPurchases.length >= 20 || totalSpend >= 3 * avgSpend) {
        segment = "vip_customer";
      }

      console.log("📊 Calculated Segment:", segment);

      // ❌ Segment filter
      if (
        filters?.segment &&
        filters.segment !== "all_customer" &&
        filters.segment !== segment
      ) {
        skippedSegment++;
        console.log(
          `❌ Skipped: Segment mismatch (required=${filters.segment}, actual=${segment})`
        );
        return false;
      }

      // 📍 Radius filter
      if (filters?.radius && filters.merchantLocation && user.location?.coordinates) {
        const [userLng, userLat] = user.location.coordinates;
        const [merchLng, merchLat] = filters.merchantLocation.coordinates;

        const distance = getDistanceFromLatLonInKm(
          userLat,
          userLng,
          merchLat,
          merchLng
        );

        console.log(`📍 Distance from merchant: ${distance.toFixed(2)} km`);

        if (distance > filters.radius) {
          skippedRadius++;
          console.log(
            `❌ Skipped: Outside radius (${distance.toFixed(2)} > ${filters.radius})`
          );
          return false;
        }
      }

      eligibleUsers++;
      console.log("✅ Eligible for promotion");
      return true;
    })
    .map((c: any) => ({
      userId: c.userId._id,
      token: c.userId.fcmToken,
    }))
    .filter((u: any) => !!u.token);

  const tokens = eligibleUsersData.map((u) => u.token);
  const userIds = eligibleUsersData.map((u) => u.userId);

  console.log("=================================================");
  console.log("📌 FILTER SUMMARY");
  console.log("❌ No FCM token:", skippedNoToken);
  console.log("❌ Points filter failed:", skippedPoints);
  console.log("❌ Segment mismatch:", skippedSegment);
  console.log("❌ Radius exceeded:", skippedRadius);
  console.log("✅ Eligible users:", eligibleUsers);
  console.log("📌 Final tokens to send:", tokens.length);
  console.log("=================================================");

  if (tokens.length === 0) {
    console.log("⚠️ No customers matched. Push not sent.");
    return { sentCount: 0, failedCount: 0, message: "No customers matched" };
  }

  // 🔔 Firebase Push (only send, no DB store here)
  console.log("🚀 Sending notification to Firebase...");

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

  console.log("📬 Firebase response:", {
    successCount: response.successCount,
    failureCount: response.failureCount,
  });

  // 🧾 Normal Notification ONLY (DB + Socket)
  console.log("🧾 Saving notifications in Notification collection...");

  await sendNotification({
    userIds,
    title: "Promotion",
    body: message,
    type: NotificationType.PROMOTION,
    metadata: {
      merchantId,
    },
    attachments: image ? [image] : [],
    channel: {
      socket: true,
      push: false, // push already done via Firebase
    },
  });

  console.log("✅ Notification saved & socket emitted");
  console.log("🏁 sendMerchantPromotion END");
  console.log("=================================================");

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
