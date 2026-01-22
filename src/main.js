const { Client, Messaging, ID } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new Messaging(client);

  // ✅ Only run on create event
  const event = req.headers["x-appwrite-event"] || "";
  if (!event.includes(".create")) {
    log("⚠️ Not a create event. Skipping.");
    return res.json({ success: true, message: "Skipped" });
  }

  try {
    log("📨 Sending Incoming Order Call Push...");

    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId) {
      throw new Error("ADMIN_USER_ID is missing in Environment Variables");
    }

    // ✅ Extract orderId from event if possible
    // Example event: databases.HarrozeDB_v1.collections.orders.documents.xxx.create
    let orderId = "";
    const parts = event.split(".");
    const docIndex = parts.findIndex((p) => p === "documents");
    if (docIndex !== -1 && parts[docIndex + 1]) {
      orderId = parts[docIndex + 1];
    }

    // ✅ SEND PUSH WITH DATA PAYLOAD ✅
    await messaging.createPush(
      ID.unique(),
      "📞 New Order Received!",
      "Tap to Accept or Reject",
      [], // topics
      [adminUserId], // ✅ target user
      [], // targets

      // ✅ DATA PAYLOAD (MOST IMPORTANT)
      {
        type: "order_call",
        orderId: orderId,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      }
    );

    log("✅ DATA Push Sent to Admin Successfully!");
    return res.json({ success: true, orderId });
  } catch (e) {
    error("❌ Failed to send push: " + e.message);
    return res.json({ success: false, error: e.message });
  }
};
