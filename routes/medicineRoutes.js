const express = require("express");
const { ObjectId } = require("mongodb");
const verifyFBtoken = require("../verifyFBtoken/midleware/verifyFBtoken");

module.exports = (medicineCollection) => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const category = req.query.category;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let query = {};
      if (category) {
        query.category = category;
      }

      const totalItems = await medicineCollection.countDocuments(query);
      const data = await medicineCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      res.send({
        data,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      });
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
      res.status(500).send({ message: "Failed to fetch medicines" });
    }
  });

  // -------- Get Discounted Medicines --------
  router.get("/discounted", async (req, res) => {
    try {
      const discounted = await medicineCollection
        .find({ discount: { $gt: 0 } }) // discount > 0
        .toArray();
      res.send(discounted);
    } catch (error) {
      res
        .status(500)
        .send({ message: "Failed to fetch discount products", error });
    }
  });

  // Get single medicine by ID
  router.get("/:id", async (req, res) => {
    const id = req.params.id;
    const medicine = await medicineCollection.findOne({
      _id: new ObjectId(id),
    });
    res.send(medicine);
  });

  // Add new medicine
  router.post("/",verifyFBtoken, async (req, res) => {
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
    const result = await medicineCollection.deleteOne({
      _id: new ObjectId(id),
    });
    res.send(result);
  });
  return router;
};
