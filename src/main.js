const sdk = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  // 1. Setup the Appwrite Client
  const client = new sdk.Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const messaging = new sdk.Messaging(client);

  // 2. Security Check: Only run if a NEW order is created
  if (req.headers['x-appwrite-event'] && !req.headers['x-appwrite-event'].includes('.create')) {
      log("Not a new order. Skipping.");
      return res.empty();
  }

  try {
    // 3. Get Order Details (Optional: You can customize the message here)
    // const orderData = req.body; 
    // const price = orderData.totalPrice || "0";

    // 4. Send the Notification to YOU (The Admin)
    log("Sending Biryani Alert...");
    
    await messaging.createPush(
      sdk.ID.unique(),                // Message ID
      "🍗 New Order Received!",       // Title
      "A customer just ordered from Harroze Biryani. Check the app!", // Body
      [],                             // Topics (leave empty)
      [process.env.ADMIN_USER_ID]     // Target: Your User ID
    );

    log("✅ Notification Sent to Admin!");
    return res.json({ success: true });

  } catch (e) {
    error("❌ Failed to send notification: " + e.message);
    return res.json({ success: false, error: e.message });
  }
};