import { Push } from "./push.model";
import { IPushPayload} from "./push.interface";

import QueryBuilder from "../../../util/queryBuilder";
import { firebaseHelper } from "../../../helpers/firebaseHelper";
import { User } from "../user/user.model";
import admin from "../../../config/firebase";


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
  // getAllPushesFromDB,
};
