const express = require("express");
const { ObjectId } = require("mongodb");

module.exports = (advertisementsCollection) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const data = req.body;
    data.status = "pending";
    const result = await advertisementsCollection.insertOne(data);
    res.send(result);
  });

  router.get("/", async (req, res) => {
    const result = await advertisementsCollection.find().toArray();
    res.send(result);
  });

  router.get("/:email", async (req, res) => {
    const result = await advertisementsCollection.find({ sellerEmail: req.params.email }).toArray();
    res.send(result);
  });

  router.patch("/toggle-slide/:id", async (req, res) => {
    const { inSlider } = req.body;
    const result = await advertisementsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { inSlider } }
    );
    res.send(result);
  });

  return router;
};
