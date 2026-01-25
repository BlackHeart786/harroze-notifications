const admin = require("firebase-admin");

let firebaseReady = false;
const lastSent = new Map(); // dedupe per runtime

module.exports = async ({ req, res, log, error }) => {
  try {
    const event = req.headers["x-appwrite-event"] || "";
    log("📌 EVENT: " + event);

    // ✅ Get document from req.body (Appwrite sends it here)
    const body = req.body ? JSON.parse(req.body) : {};
    const orderId = body?.$id || body?.documentId;

    if (!orderId) {
      log("⚠️ No orderId found in payload");
      return res.json({ success: false, error: "orderId missing" });
    }

    // ✅ DEDUPE: same order within 10 sec = skip
    const now = Date.now();
    if (lastSent.has(orderId) && now - lastSent.get(orderId) < 10000) {
      log("⚠️ Duplicate trigger skipped for orderId: " + orderId);
      return res.json({ success: true, skipped: true, orderId });
    }
    lastSent.set(orderId, now);

    if (!firebaseReady) {
      const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseReady = true;
      log("✅ Firebase Admin initialized");
    }

    const message = {
      topic: "admin_orders",
      android: { priority: "high" },
      data: {
        type: "order_call",
        orderId: orderId.toString(),
      },
    };

    const result = await admin.messaging().send(message);
    log("✅ PUSH SENT: " + result);

    return res.json({ success: true, messageId: result, orderId });
  } catch (e) {
    error("❌ " + e.message);
    return res.json({ success: false, error: e.message }, 500);
  }
};
