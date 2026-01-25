const admin = require("firebase-admin");

let firebaseReady = false;

module.exports = async ({ req, res, log, error }) => {
  try {
    const event = req.headers["x-appwrite-event"] || "";

    // ✅ Trigger only on CREATE events
    if (!event.includes(".create")) {
      return res.json({ success: true, message: "Skipped (not create event)" });
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

    // ✅ Get orderId from Appwrite document payload (BEST)
    // Appwrite sends event data inside req.body as JSON string sometimes
    let body = req.body;

    try {
      if (typeof body === "string") body = JSON.parse(body);
    } catch (_) {}

    // ✅ Get Appwrite document ID (stable orderId)
    const orderId =
      body?.payload?.$id ||
      body?.payload?.document?.$id ||
      body?.$id ||
      Date.now().toString();

    // ✅ DATA ONLY (DO NOT ADD notification:{} )
    const message = {
      topic: "order_received",
      data: {
        type: "order_call",
        orderId: String(orderId),
      },

      android: {
        priority: "high",
        ttl: 60 * 1000, // ✅ 1 minute
      },
    };

    const result = await admin.messaging().send(message);

    log("✅ Sent call push to topic order_received => " + result);

    return res.json({
      success: true,
      messageId: result,
      orderId: String(orderId),
    });
  } catch (e) {
    error("❌ " + e.message);
    return res.json({ success: false, error: e.message }, 500);
  }
};
