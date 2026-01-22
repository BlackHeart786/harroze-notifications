const { Client, Messaging, ID } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  // 1. Setup the Appwrite Client
  const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new Messaging(client);

  // 2. Security Check: Only run if a NEW order is created
  if (
    req.headers["x-appwrite-event"] &&
    !req.headers["x-appwrite-event"].includes(".create")
  ) {
    log("Not a new order. Skipping.");
    return res.json({ success: true, message: "Skipped (Not a create event)" });
  }

  try {
    log("Sending Incoming Order Call Alert...");

    await messaging.createPush(
      ID.unique(), // Message ID
      "📞 New Order Received!", // Title
      "Tap to Accept or Reject", // Body
      [], // Topics (empty)
      [process.env.ADMIN_USER_ID], // Target: Admin User ID

      
      {
        type: "order_call", 
        restaurant: "Harroze Biryani",
        time: new Date().toISOString(),
      }
    );

    log("✅ Incoming Order Call Notification Sent to Admin!");
    return res.json({ success: true });
  } catch (e) {
    error("❌ Failed to send notification: " + e.message);
    return res.json({ success: false, error: e.message });
  }
};
