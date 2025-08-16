module.exports = (db) => {
  const express = require("express");
  const router = express.Router();
  const subscribersCollection = db.collection("subscribers");

  // POST /newsletter/subscribe
  router.post("/subscribe", async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
      // Check if already subscribed
      const exists = await subscribersCollection.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already subscribed" });
      }

      await subscribersCollection.insertOne({ email, createdAt: new Date() });

      res.status(201).json({ message: "Subscribed successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
};
