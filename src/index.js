const sdk = require("node-appwrite");

module.exports = async ({ req, res }) => {
  try {
    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const messaging = new sdk.Messaging(client);

    const orderId = req.body?.orderId || Date.now().toString();

    await messaging.createPush(
      "order_received", // messageId
      {
        title: "New Order",
        body: "New order received",
        data: {
          type: "order_call",
          orderId: orderId,
        },
      },
      ["user:694d508c97a59049afe8"] 
    );

    return res.json({
      success: true,
      orderId,
    });
  } catch (err) {
    console.error(err);
    return res.json({ error: err.message }, 500);
  }
};
