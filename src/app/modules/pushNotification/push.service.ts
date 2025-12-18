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

  // 1️⃣ Base filter
  const userFilter: any = {
    fcmToken: { $exists: true, $ne: null },
  };

  // 2️⃣ Apply filters only if SPECIFIC
  if (sendType === "SPECIFIC") {
    if (location) userFilter.city = location;
    if (tier) userFilter.tier = tier;
    if (subscriptionType)
      userFilter.subscription = subscriptionType;
    if (status) userFilter.status = status;
  }

  // 3️⃣ Fetch users
  const users = await User.find(userFilter).select("fcmToken");

  const tokens = users
    .map((u) => u.fcmToken)
    .filter((t): t is string => !!t);

  if (tokens.length === 0) {
    return {
      sentCount: 0,
      failedCount: 0,
      message: "No users matched the criteria",
    };
  }

  // 4️⃣ Send notification
  const message = {
    notification: { title, body },
    tokens,
  };

  const response = await admin.messaging().sendMulticast(message);

  return {
    sentCount: response.successCount,
    failedCount: response.failureCount,
  };
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
