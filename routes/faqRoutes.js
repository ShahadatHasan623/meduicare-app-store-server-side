const express = require("express");

module.exports = (faqCollection) => {
  const router = express.Router();

  // ✅ GET all FAQs
  router.get("/", async (req, res) => {
    try {
      const faqs = await faqCollection.find({}).toArray();
      res.json(faqs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ POST a new FAQ
  router.post("/", async (req, res) => {
    try {
      const { question, answer } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ message: "Question and Answer are required" });
      }

      const result = await faqCollection.insertOne({ question, answer, createdAt: new Date() });
      res.status(201).json({ message: "FAQ added", id: result.insertedId });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
