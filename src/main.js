const { Client, Messaging, ID } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new Messaging(client);

  // ✅ Only run on create event
  if (
    req.headers["x-appwrite-event"] &&
    !req.headers["x-appwrite-event"].includes(".create")
  ) {
    log("Not a create event. Skipping.");
    return res.json({ success: true, message: "Skipped" });
  }

  try {
    log("📨 Sending Incoming Order Call...");
    log("✅ ADMIN_USER_ID = " + process.env.ADMIN_USER_ID);

    await messaging.createPush(
      ID.unique(),
      "📞 New Order Received!",
      "Tap to Accept or Reject",
      [], // topics
      [process.env.ADMIN_USER_ID] // ✅ USERS ARRAY (User ID must be valid)
    );

    log("✅ Notification Sent to Admin!");
    return res.json({ success: true });
  } catch (e) {
    error("❌ Failed to send notification: " + e.message);
    return res.json({ success: false, error: e.message });
  }
};
