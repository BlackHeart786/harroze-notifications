const { Client, Messaging, Users, ID } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new Messaging(client);
  const users = new Users(client);

  // ✅ only create events
  const event = req.headers["x-appwrite-event"] || "";
  if (!event.includes(".create")) {
    return res.json({ success: true, message: "Skipped (not create)" });
  }

  try {
    const adminUserId = process.env.ADMIN_USER_ID;

    // ✅ get admin push targets
    const targetsRes = await users.listTargets(adminUserId);

    const pushTargets = targetsRes.targets.filter((t) => t.providerType === "push");

    if (pushTargets.length === 0) {
      throw new Error("No PUSH targets found. Admin device not registered.");
    }

    const pushTargetIds = pushTargets.map((t) => t.$id);

    await messaging.createPush(
      ID.unique(),
      "📞 New Order Received!",
      "Tap to Accept or Reject",
      [],
      pushTargetIds, // ✅ CORRECT ✅
      { type: "order_call" }
    );

    return res.json({ success: true, sentTo: pushTargetIds });
  } catch (e) {
    error(e.message);
    return res.json({ success: false, error: e.message });
  }
};
