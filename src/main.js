const { Client, Messaging, ID } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new Messaging(client);

  try {
    log("📨 Sending Incoming Order Call...");

    await messaging.createPush(
      ID.unique(),
      "📞 New Order Received!",
      "Tap to Accept or Reject",
      [],

      // ✅ THIS must be the TARGET ID
      [process.env.ADMIN_TARGET_ID]
    );

    log("✅ Notification Sent Successfully!");
    return res.json({ success: true });
  } catch (e) {
    error("❌ Failed to send notification: " + e.message);
    return res.json({ success: false, error: e.message });
  }
};
