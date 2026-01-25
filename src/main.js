const admin = require("firebase-admin");

let firebaseReady = false;

module.exports = async ({ req, res, log, error }) => {
  try {
    const event = req.headers["x-appwrite-event"] || "";

    // ✅ Only order create event
    if (!event.includes(".create")) {
      return res.json({ success: true, message: "Skipped (not create)" });
    }

    // ✅ Init Firebase Admin once
    if (!firebaseReady) {
      const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseReady = true;
      log("✅ Firebase Admin initialized");
    }

    // ✅ DATA ONLY PUSH (NO notification:{} )
    const message = {
      topic: "order_received",
      android: { priority: "high" },
      data: {
        type: "order_call",
        title: "📦 New Order Received!",
        body: "Tap Accept or Reject",
        orderId: Date.now().toString(),
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
