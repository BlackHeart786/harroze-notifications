const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

// ✅ Put Firebase service account JSON inside ENV
// process.env.FCM_SERVICE_ACCOUNT_JSON = "... one line json ..."

let firebaseReady = false;

function initFirebase() {
  if (firebaseReady) return;

  const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  firebaseReady = true;
  console.log("✅ Firebase Admin Initialized");
}

// ✅ API Endpoint called by USER APP after order created
app.post("/sendOrderPush", async (req, res) => {
  try {
    initFirebase();

    const orderId = req.body.orderId || Date.now().toString();

    // ✅ DATA ONLY (NO notification key)
    const message = {
      topic: "order_received",
      data: {
        type: "order_call",
        orderId: orderId,
      },
      android: {
        priority: "high",
      },
    };

    const result = await admin.messaging().send(message);

    return res.json({ success: true, messageId: result, orderId });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Harroze Push Server Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on port " + PORT));
