const { Client, Messaging, ID } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint("https://sgp.cloud.appwrite.io/v1")
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY); // ✅ MUST be APPWRITE_API_KEY (not APPWRITE_APIKEY)

    const messaging = new Messaging(client);

    const eventName = req.headers["x-appwrite-event"] || "";
    log("📌 Event: " + eventName);

    // ✅ Only trigger on create
    if (!eventName.includes(".create")) {
      log("⏭️ Not a create event. Skipping.");
      return res.json({ success: true, skipped: true });
    }

    // ✅ You MUST send DATA for background screen off
    const payload = {
      type: "order_call",
      title: "📞 New Order Received!",
      body: "Tap to Accept or Reject",
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    };

    log("📨 Sending DATA Push to Admin: " + process.env.ADMIN_USER_ID);

    await messaging.createPush(
      ID.unique(),
      payload.title,
      payload.body,
      [], // topics
      [process.env.ADMIN_USER_ID], // ✅ users
      payload // ✅ DATA PAYLOAD (MOST IMPORTANT)
    );

    log("✅ Push Sent Successfully!");
    return res.json({ success: true });
  } catch (e) {
    error("❌ Push Failed: " + e.message);
    return res.json({ success: false, error: e.message });
  }
};
