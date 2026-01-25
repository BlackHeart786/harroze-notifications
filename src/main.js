const admin = require("firebase-admin");

let firebaseReady = false;
const lastSent = new Map(); // ✅ Deduplicate by orderId

module.exports = async ({ req, res, log, error }) => {
  try {
    const event = req.headers["x-appwrite-event"] || "";
    log("📌 EVENT: " + event);

    // ✅ Only create events
    if (!event.includes(".create")) {
      return res.json({ success: true, skipped: true, reason: "not create" });
    }

    // ✅ SAFE BODY PARSE (FIX ✅)
    let body = {};
    if (typeof req.body === "string") {
      body = JSON.parse(req.body);
    } else if (typeof req.body === "object" && req.body !== null) {
      body = req.body;
    }

    // ✅ Get Order Document ID
    const orderId = body?.$id || body?.documentId;

    if (!orderId) {
      log("⚠️ orderId missing in payload");
      return res.json({ success: false, error: "orderId missing" }, 400);
    }

    // ✅ DEDUPE: Prevent multiple push for same order within 15 sec
    const now = Date.now();
    if (lastSent.has(orderId) && now - lastSent.get(orderId) < 15000) {
      log("⚠️ Duplicate trigger blocked: " + orderId);
      return res.json({ success: true, skipped: true, orderId });
    }
    lastSent.set(orderId, now);

    // ✅ Init Firebase once
    if (!firebaseReady) {
      const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseReady = true;
      log("✅ Firebase Admin initialized");
    }

    // ✅ Send PUSH to topic
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
