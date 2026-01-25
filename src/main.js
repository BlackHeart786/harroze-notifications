const admin = require("firebase-admin");

let firebaseReady = false;

module.exports = async ({ req, res, log, error }) => {
  try {
    // ✅ Only trigger for order create
    const event = req.headers["x-appwrite-event"] || "";
    if (!event.includes(".create")) {
      return res.json({ success: true, message: "Skipped (not create event)" });
    }

    // ✅ Init Firebase only once (FAST)
    if (!firebaseReady) {
      const serviceAccount = JSON.parse(
        process.env.FCM_SERVICE_ACCOUNT_JSON || "{}"
      );

      if (!serviceAccount.project_id) {
        throw new Error("FCM_SERVICE_ACCOUNT_JSON is missing or invalid");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseReady = true;
      log("✅ Firebase Admin initialized");
    }

    // ✅ Create unique order id
    const orderId = Date.now().toString();

    // ✅ Data-only payload (FAST & BEST FOR BACKGROUND)
    const message = {
      topic: "order_received",
      data: {
        type: "order_call",
        orderId,
        title: "📦 New Order Received!",
        body: "Tap Accept or Reject",
      },
      android: {
        priority: "high",
      },
    };

    // ✅ Send notification
    const result = await admin.messaging().send(message);

    log("✅ Sent to topic order_received => " + result);

    // ✅ Return immediately (IMPORTANT ✅)
    return res.json({
      success: true,
      messageId: result,
      orderId,
    });
  } catch (e) {
    error("❌ ERROR: " + e.message);

    return res.json(
      {
        success: false,
        error: e.message,
      },
      500
    );
  }
};
