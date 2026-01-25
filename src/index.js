const admin = require("firebase-admin");

let firebaseReady = false;

module.exports = async ({ req, res, log, error }) => {
  try {
    const event = req.headers["x-appwrite-event"] || "";

    // ✅ Trigger only on create
    if (!event.includes(".create")) {
      return res.json({ success: true, message: "Skipped (not create event)" });
    }

    // ✅ Init Firebase once
    if (!firebaseReady) {
      const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseReady = true;
      log("✅ Firebase Admin initialized");
    }

    // ✅ Unique orderId
    const orderId = Date.now().toString();

    const message = {
      topic: "order_received",

      // ✅ This makes lockscreen notification ALWAYS
      notification: {
        title: "📦 New Order Received!",
        body: "Tap Accept or Reject",
      },

      // ✅ Also send data for app handling
      data: {
        type: "order_call",
        orderId: orderId,
        title: "📦 New Order Received!",
        body: "Tap Accept or Reject",
      },

      android: {
        priority: "high",
        notification: {
          channelId: "order_call_channel", // ✅ MUST match flutter notification channel
          sound: "default",
          priority: "max",
          visibility: "public",
        },
      },
    };

    const result = await admin.messaging().send(message);
    log("✅ Sent to topic order_received => " + result);

    return res.json({ success: true, messageId: result, orderId });
  } catch (e) {
    error("❌ " + e.message);
    return res.json({ success: false, error: e.message }, 500);
  }
};
