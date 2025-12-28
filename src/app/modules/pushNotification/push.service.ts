import { Push } from "./push.model";
import { IPushPayload} from "./push.interface";

import QueryBuilder from "../../../util/queryBuilder";
import { firebaseHelper } from "../../../helpers/firebaseHelper";
import { User } from "../user/user.model";
import admin from "../../../config/firebase";
import { DigitalCard } from "../customer/digitalCard/digitalCard.model";


// Send push (existing)


const sendNotificationToAllUsers = async (
  payload: IPushPayload,
  adminId: string
) => {
  const {
    sendType,
    title,
    body,
    location,
    tier,
    subscriptionType,
    status,
  } = payload;

  try {
    console.log("[Notification] Payload received:", payload);
    console.log("[Notification] Admin ID:", adminId);

    // 1️⃣ Base filter
    const userFilter: any = {
      fcmToken: { $exists: true, $ne: null },
    };

    console.log("[Notification] Base user filter:", userFilter);

    // 2️⃣ Apply SPECIFIC filters
    if (sendType === "SPECIFIC") {
      console.log("[Notification] Applying SPECIFIC filters");
      if (location) userFilter.city = location;
      if (tier) userFilter.tier = tier.toUpperCase();
      if (subscriptionType) userFilter.subscription = subscriptionType.toUpperCase();
      if (status) userFilter.status = status.toUpperCase();
      console.log("[Notification] Updated user filter:", userFilter);
    }

    // 3️⃣ Fetch users
    const users = await User.find(userFilter).select("fcmToken");
    console.log("[Notification] Users fetched from DB:", users.length);

    const tokens = users
      .map((u) => u.fcmToken)
      .filter((t): t is string => !!t);

    console.log("[Notification] Tokens found:", tokens);

    if (tokens.length === 0) {
      console.log("[Notification] No tokens to send push");
      return {
        sentCount: 0,
        failedCount: 0,
        message: "No users matched the criteria",
      };
    }

    // 4️⃣ Send push via Firebase - CORRECTED METHOD
    const message = {
      notification: { 
        title, 
        body 
      },
      tokens, // Maximum 500 tokens at a time
    };

    console.log("[Notification] Message prepared for Firebase:", message);

    // ✅ Use sendEachForMulticast instead of sendAll
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(
      `[Notification] Push sent. Success: ${response.successCount}, Failed: ${response.failureCount}`
    );

    // Optional: Log failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`[Notification] Failed token: ${tokens[idx]}`, resp.error);
          failedTokens.push(tokens[idx]);
        }
      });
      
      // Remove invalid tokens from database
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

  console.log("📌 Merchant ID:", merchantId);
  console.log("📌 Payload received:", payload);

  const cards = await DigitalCard.find({ merchantId })
    .populate("userId", "fcmToken location totalPurchases totalSpend purchases")
    .select("userId availablePoints")
    .lean();

  console.log(`📌 Customers fetched from DB: ${cards.length}`);

  const tokens = cards
    .filter((c: any) => {
      const user = c.userId;
      if (!user?.fcmToken) return false;

      // Points filter
      if (target?.type === "points" && filters?.minPoints !== undefined) {
        if ((c.availablePoints ?? 0) < filters.minPoints) {
          console.log(`❌ User ${user._id} skipped due to points: ${c.availablePoints}`);
          return false;
        }
      }

      // Segment check
      let segment = "all_customer";
      const totalPurchases = user.totalPurchases || 0;
      const purchases = user.purchases || [];
      const last6MonthsPurchases = purchases.filter(
        (p: any) =>
          new Date(p.createdAt) >= new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
      );
      const totalSpend = user.totalSpend || 0;
      const avgSpend = 1000;

      if (
        totalPurchases === 0 ||
        (totalPurchases === 1 &&
          purchases[0]?.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      ) {
        segment = "new_customer";
      } else if (totalPurchases >= 2 && last6MonthsPurchases.length < 5) {
        segment = "returning_customer";
      } else if (last6MonthsPurchases.length >= 5 || totalSpend >= 1.5 * avgSpend) {
        segment = "loyal_customer";
      } else if (last6MonthsPurchases.length >= 20 || totalSpend >= 3 * avgSpend) {
        segment = "vip_customer";
      }

      // ✅ Fix: allow all_customer to include everyone
      if (filters?.segment && filters.segment !== "all_customer" && filters.segment !== segment) {
        console.log(`❌ User ${user._id} skipped due to segment mismatch: ${segment}`);
        return false;
      }

      // Radius filter
      if (filters?.radius && filters.merchantLocation && user.location?.coordinates) {
        const [userLng, userLat] = user.location.coordinates;
        const [merchLng, merchLat] = filters.merchantLocation.coordinates;
        const distance = getDistanceFromLatLonInKm(userLat, userLng, merchLat, merchLng);
        if (distance > filters.radius) {
          console.log(`❌ User ${user._id} skipped due to radius: ${distance.toFixed(2)} km`);
          return false;
        }
        console.log(`✅ User ${user._id} within radius: ${distance.toFixed(2)} km`);
      }

      return true;
    })
    .map((c: any) => c.userId.fcmToken)
    .filter((t: string | undefined): t is string => !!t);

  console.log("📌 Final tokens to send:", tokens.length);

  if (tokens.length === 0) {
    return { sentCount: 0, failedCount: 0, message: "No customers matched" };
  }

  const firebaseMessage = {
    notification: { title: "Promotion", body: message, image },
    data: { type: "promotion", merchantId: merchantId.toString() },
    tokens,
  };

  const response = await admin.messaging().sendEachForMulticast(firebaseMessage);

  await Push.create({
    title: "Promotion",
    body: message,
    state: "PROMOTION",
    createdBy: merchantId,
    sentCount: response.successCount,
    failedCount: response.failureCount,
  });

  return { sentCount: response.successCount, failedCount: response.failureCount };
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
