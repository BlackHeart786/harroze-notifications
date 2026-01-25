const admin = require("firebase-admin");

let firebaseReady = false;

module.exports = async ({ req, res, log, error }) => {
  try {
    // ✅ Trigger only on create
    const event = req.headers["x-appwrite-event"] || "";
    if (!event.includes(".create")) {
      return res.json({ success: true, message: "Skipped (not create event)" });
    }

    // ✅ Init firebase once
    if (!firebaseReady) {
      const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseReady = true;
      log("✅ Firebase Admin initialized");
    }

    // ✅ Unique orderId (must be unique always)
    const orderId = Date.now().toString();

    // ✅ IMPORTANT ✅ Send notification + data
    const message = {
      topic: "order_received",

      // ✅ This makes Android show notification on lockscreen always
      notification: {
        title: "📦 New Order Received!",
        body: "Tap Accept or Reject",
      },

      // ✅ This is your flutter app logic data
      data: {
        type: "order_call",
        orderId: orderId,
        title: "📦 New Order Received!",
        body: "Tap Accept or Reject",
      },

      android: {
        priority: "high",

        ttl: 60000, // ✅ 60 sec

        notification: {
          channelId: "order_call_channel", // ✅ MUST MATCH flutter channel
          priority: "max",
          visibility: "public",
          sound: "default",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
    };

    const result = await admin.messaging().send(message);

    log("✅ Sent to topic order_received => " + result);

    return res.json({ success: true, messageId: result });
  } catch (e) {
    error("❌ " + e.message);
    return res.json({ success: false, error: e.message }, 500);
  }
};
