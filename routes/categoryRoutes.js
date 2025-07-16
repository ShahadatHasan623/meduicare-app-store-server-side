const express = require("express");
const { ObjectId } = require("mongodb");

module.exports = (categoryCollection) => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const result = await categoryCollection.find().toArray();
    res.send(result);
  });

  router.post("/", async (req, res) => {
    const category = req.body;
    const result = await categoryCollection.insertOne(category);
    res.send(result);
  });

  router.patch("/:id", async (req, res) => {
    const data = req.body;
    const result = await categoryCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: data }
    );
    res.send(result);
  });

  router.delete("/:id", async (req, res) => {
    const result = await categoryCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  });

  return router;
};
