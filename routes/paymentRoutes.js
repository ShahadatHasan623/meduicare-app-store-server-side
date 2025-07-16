const express = require("express");
const { ObjectId } = require("mongodb");

module.exports = (paymentsCollection) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const payment = req.body;
    payment.status = "pending";
    payment.date = new Date();
    const result = await paymentsCollection.insertOne(payment);
    res.send(result);
  });

  router.get("/", async (req, res) => {
    const result = await paymentsCollection.find().toArray();
    res.send(result);
  });

  router.patch("/:id", async (req, res) => {
    const result = await paymentsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: "paid" } }
    );
    res.send(result);
  });

  router.get("/user/:email", async (req, res) => {
    const result = await paymentsCollection.find({ buyerEmail: req.params.email }).sort({ date: -1 }).toArray();
    res.send(result);
  });

  router.get("/seller/:email", async (req, res) => {
    const result = await paymentsCollection.find({ sellerEmail: req.params.email }).sort({ date: -1 }).toArray();
    res.send(result);
  });

  router.get("/summary/admin", async (req, res) => {
    const allPayments = await paymentsCollection.find().toArray();
    const paidTotal = allPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const pendingTotal = allPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    res.send({ paidTotal, pendingTotal });
  });

  router.get("/summary/seller/:email", async (req, res) => {
    const email = req.params.email;
    const sellerPayments = await paymentsCollection.find({ sellerEmail: email }).toArray();
    const paidTotal = sellerPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const pendingTotal = sellerPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    res.send({ paidTotal, pendingTotal });
  });

  router.get("/report", async (req, res) => {
    const { startDate, endDate } = req.query;
    let filter = {};
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    const result = await paymentsCollection.find(filter).sort({ date: -1 }).toArray();
    res.send(result);
  });

  return router;
};
