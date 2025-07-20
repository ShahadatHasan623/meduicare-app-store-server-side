const express = require("express");
const { ObjectId } = require("mongodb");

module.exports = (medicineCollection) => {
  const router = express.Router();

  // Get all medicines
  router.get("/", async (req, res) => {
    const category = req.query.category;
    let query = {};
    if (category) {
      query = { category: category };
    }
    const result = await medicineCollection.find(query).toArray();
    res.send(result);
  });

  // Get single medicine by ID
  router.get("/:id", async (req, res) => {
    const id = req.params.id;
    const medicine = await medicineCollection.findOne({ _id: new ObjectId(id) });
    res.send(medicine);
  });

  // Add new medicine
  router.post("/", async (req, res) => {
    const medicine = req.body;
    const result = await medicineCollection.insertOne(medicine);
    res.send(result);
  });

  // Update medicine
  router.patch("/:id", async (req, res) => {
    const id = req.params.id;
    const updateData = req.body;
    const result = await medicineCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    res.send(result);
  });

  // Delete medicine
  router.delete("/:id", async (req, res) => {
    const id = req.params.id;
    const result = await medicineCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  });

  return router;
};
