const express = require("express");
const { ObjectId } = require("mongodb");

module.exports = (medicinesCollection) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const data = req.body;
    data.status = "available";
    const result = await medicinesCollection.insertOne(data);
    res.send(result);
  });

//   router.get("/", async (req, res) => {
//     const email = req.query.sellerEmail;
//     let filter = {};

//     if (email) {
//       filter = { sellerEmail: email };
//     }

//     const result = await medicinesCollection.find(filter).toArray();
//     res.send(result);
//   });
  router.get("/", async (req, res) => {
    const email = req.query.sellerEmail;
    const result = await medicinesCollection
      .find({ sellerEmail: email })
      .toArray();
    res.send(result);
  });

  router.delete("/:id", async (req, res) => {
    const result = await medicinesCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  });

  return router;
};
