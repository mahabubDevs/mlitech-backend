import admin from "firebase-admin"; // firebase-admin init করা আছে ধরে নিই

export const sendPushNotification = async (fcmToken: string, title: string, body: string, data?: Record<string, string>) => {
  if (!fcmToken) return;

  

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: data || {},
  };

  try {
    await admin.messaging().send(message);
    console.log("Push notification sent to:", fcmToken);
  } catch (err) {
    console.error("Failed to send push notification:", err);
  }
};
