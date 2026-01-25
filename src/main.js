const admin = require("firebase-admin");

let firebaseReady = false;

module.exports = async ({ req, res, log, error }) => {
  try {
    const event = req.headers["x-appwrite-event"] || "";
    if (!event.includes(".create")) {
      return res.json({ success: true, message: "Skipped (not create)" });
    }

    if (!firebaseReady) {
      const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseReady = true;
      log("✅ Firebase Admin initialized");
    }

    // ✅ DATA ONLY - this triggers background handler reliably
    const message = {
      topic: "admin_orders",
      android: {
        priority: "high",
      },
      data: {
        type: "order_call",
        title: "HARROZE BIRIYANI",
        body: "📦New Order Received! Tap to open",
      },
    };

    const result = await admin.messaging().send(message);

    log("✅ DATA push sent: " + result);
    return res.json({ success: true, messageId: result });
  } catch (e) {
    error("❌ " + e.message);
    return res.json({ success: false, error: e.message }, 500);
  }
};
