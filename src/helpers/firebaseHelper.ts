import admin from 'firebase-admin';
import serviceAccount from "./firebaseSDK.json";
import { logger } from '../shared/logger';

// Cast serviceAccount to ServiceAccount type
const serviceAccountKey: admin.ServiceAccount = serviceAccount as admin.ServiceAccount;

// Initialize Firebase SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
  });
}

// Multiple users
const sendPushNotifications = async (
  values: admin.messaging.MulticastMessage
): Promise<{ successCount: number; failureCount: number }> => {
  const res = await admin.messaging().sendEachForMulticast(values);
  logger.info('Notifications sent successfully', res);

  return { successCount: res.successCount, failureCount: res.failureCount };
};

// Single user
const sendPushNotification = async (
  values: admin.messaging.Message
): Promise<string> => {
  const res = await admin.messaging().send(values);
  logger.info('Notification sent successfully', res);

  return res; // returns message ID
};

export const firebaseHelper = {
  sendPushNotifications,
  sendPushNotification,
};

/* Example Usage:

const message: admin.messaging.MulticastMessage = {
  notification: {
    title: `${payload.offerTitle}`,
    body: `A new offer is available for you`,
  },
  tokens: users
    .map(user => user.deviceToken)
    .filter((token): token is string => !!token), // type-safe filter
};

// send to multiple users
const result = await firebaseHelper.sendPushNotifications(message);
console.log(result.successCount, result.failureCount);

*/
