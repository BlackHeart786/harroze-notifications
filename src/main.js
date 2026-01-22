const { Client, Messaging, Users, ID } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new Messaging(client);
  const users = new Users(client);

  // ✅ Only run on create event
  const event = req.headers["x-appwrite-event"] || "";
  if (!event.includes(".create")) {
    log("Not a create event. Skipping.");
    return res.json({ success: true, message: "Skipped" });
  }

  try {
    log("📨 Sending Incoming Order Call...");

    const adminUserId = process.env.ADMIN_USER_ID;

    if (!adminUserId) {
      throw new Error("ADMIN_USER_ID is missing in env variables");
    }

    // ✅ Get Admin Push Targets
    const targetsRes = await users.listTargets(adminUserId);

    if (!targetsRes.targets || targetsRes.targets.length === 0) {
      throw new Error("❌ No push targets found for ADMIN user. Device not registered!");
    }

    const targetIds = targetsRes.targets.map((t) => t.$id);

    log("✅ Found targets: " + JSON.stringify(targetIds));

    // ✅ Send push with DATA payload (MOST IMPORTANT ✅)
    await messaging.createPush(
      ID.unique(),
      "📞 New Order Received!",
      "Tap to Accept or Reject",
      [], // topics
      targetIds, // ✅ TARGET IDs ✅
      {
        type: "order_call",
      }
    );

    log("✅ Push Sent to Admin Targets!");
    return res.json({ success: true });
  } catch (e) {
    error("❌ Failed to send push: " + e.message);
    return res.json({ success: false, error: e.message });
  }
};
