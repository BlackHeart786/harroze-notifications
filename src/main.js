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
    log("Not a create event. Skipping...");
    return res.json({ success: true, message: "Skipped" });
  }

  try {
    log("📨 Sending Incoming Order Call...");

    const adminUserId = process.env.ADMIN_USER_ID;

    if (!adminUserId) {
      throw new Error("ADMIN_USER_ID missing in env variables");
    }

    // ✅ Get admin targets
    const targetsRes = await users.listTargets(adminUserId);

    if (!targetsRes.targets || targetsRes.targets.length === 0) {
      throw new Error("❌ No targets found. Admin device not registered!");
    }

    // ✅ ONLY PUSH TARGETS ✅
    const pushTargets = targetsRes.targets.filter(
      (t) => t.providerType === "push"
    );

    if (pushTargets.length === 0) {
      throw new Error("❌ No PUSH targets found. (Only push works for FCM)");
    }

    // ✅ Extract real push target IDs
    const pushTargetIds = pushTargets.map((t) => t.$id);

    log("✅ PUSH Target IDs: " + JSON.stringify(pushTargetIds));

    // ✅ Send push to PUSH TARGET IDS ✅✅✅
    await messaging.createPush(
      ID.unique(),
      "📞 New Order Received!",
      "Tap to Accept or Reject",
      [], // topics
      pushTargetIds, // ✅ IMPORTANT ✅ push target IDs only
      {
        type: "order_call",
      }
    );

    log("✅ Push Sent Successfully!");
    return res.json({ success: true });
  } catch (e) {
    error("❌ Failed to send push: " + e.message);
    return res.json({ success: false, error: e.message });
  }
};
