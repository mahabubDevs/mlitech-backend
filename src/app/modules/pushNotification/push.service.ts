import { Push } from "./push.model";
import { ICreatePush, IPushResponse } from "./push.interface";

import QueryBuilder from "../../../util/queryBuilder";
import { firebaseHelper } from "../../../helpers/firebaseHelper";
import { User } from "../user/user.model";
import admin from "../../../config/firebase";

// Send push (existing)
const sendNotificationToAllUsers = async (title: string, body: string) => {
    const users = await User.find({ fcmToken: { $exists: true, $ne: null } }).select("fcmToken");

    const tokens = users
        .map(u => u.fcmToken)
        .filter((token): token is string => !!token); // remove undefined

    if (tokens.length === 0) {
        return { sent: 0, message: "No users with FCM tokens" };
    }

    const message = {
        notification: { title, body },
        tokens
    };

    const response = await admin.messaging().sendMulticast(message);

    return {
        successCount: response.successCount,
        failureCount: response.failureCount
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
