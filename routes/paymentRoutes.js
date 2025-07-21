const express = require("express");
const { ObjectId } = require("mongodb");
const verifyFBtoken = require("../verifyFBtoken/midleware/verifyFBtoken");

module.exports = (paymentsCollection) => {
  const router = express.Router();

  /** ---------- Create Payment ---------- **/
  router.post("/",verifyFBtoken, async (req, res) => {
    try {
      let { buyerEmail, transactionId, totalPrice, cartItems, status } =
        req.body;

      if (!buyerEmail || !transactionId || !Array.isArray(cartItems)) {
        return res
          .status(400)
          .send({ message: "Missing required payment fields" });
      }

      totalPrice = Number(totalPrice);
      if (isNaN(totalPrice)) {
        return res.status(400).send({ message: "Invalid totalPrice" });
      }

      status = status || "pending";

      const payment = {
        buyerEmail: buyerEmail.toLowerCase(),
        transactionId,
        totalPrice,
        status,
        date: new Date(),
        cartItems,
      };

      const result = await paymentsCollection.insertOne(payment);

      res.status(201).send({
        message: "Payment created",
        insertedId: result.insertedId,
        acknowledged: result.acknowledged,
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).send({ message: "Failed to save payment", error });
    }
  });

  /** ---------- Get Payment Report (Keep Before :id) ---------- **/
  router.get("/report",verifyFBtoken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filter = {};

      if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const payments = await paymentsCollection
        .find(filter)
        .sort({ date: -1 })
        .toArray();

      const salesData = [];
      payments.forEach((payment) => {
        (payment.cartItems || []).forEach((item) => {
          salesData.push({
            paymentId: payment._id,
            medicineName: item.name,
            sellerEmail: item.sellerEmail,
            buyerEmail: payment.buyerEmail,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: (item.quantity || 1) * (item.unitPrice || 0),
            status: payment.status,
            date: payment.date,
          });
        });
      });

      res.send(salesData);
    } catch (error) {
      console.error("Error fetching payment report:", error);
      res.status(500).send({ message: "Failed to fetch report", error });
    }
  });

  /** ---------- Get User Payment History ---------- **/
  router.get("/user/:email", async (req, res) => {
    try {
      const email = req.params.email.toLowerCase();
      const payments = await paymentsCollection
        .find({ buyerEmail: email })
        .sort({ date: -1 })
        .toArray();

      const formatted = payments.map((p) => ({
        _id: p._id,
        amount: p.totalPrice || 0,
        transactionId: p.transactionId || "N/A",
        status: p.status || "pending",
        date: p.date,
      }));

      res.status(200).send(formatted);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).send({ message: "Failed to fetch user payments", error });
    }
  });

  /** ---------- Get ALL Payments (Admin) ---------- **/
  router.get("/",verifyFBtoken, async (_req, res) => {
    try {
      const payments = await paymentsCollection
        .find()
        .sort({ date: -1 })
        .toArray();
      const formattedPayments = payments.map((p) => {
        const sellerEmails = (p.cartItems || [])
          .map((item) => item.sellerEmail)
          .filter(Boolean);
        return {
          ...p,
          sellerEmails: [...new Set(sellerEmails)],
        };
      });
      res.send(formattedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).send({ message: "Server error", error });
    }
  });

  /** ---------- Update Status to Paid ---------- **/
  router.patch("/:id", async (req, res) => {
    try {
      const paymentId = req.params.id;

      if (!ObjectId.isValid(paymentId)) {
        return res.status(400).send({ message: "Invalid payment ID" });
      }

      const filter = {
        _id: new ObjectId(paymentId),
        status: { $in: ["pending", "unpaid"] },
      };
      const updateDoc = { $set: { status: "paid", paidDate: new Date() } };

      const result = await paymentsCollection.updateOne(filter, updateDoc);

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .send({ message: "Payment not found or already paid" });
      }

      res.status(200).send({
        message: "Payment status updated to paid",
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).send({ message: "Update failed", error });
    }
  });

  /** ---------- Payment by ID (Keep at Last) ---------- **/
  router.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid payment ID" });
      }

      const payment = await paymentsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Payment GET error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  /** ---------- Get Seller Payments ---------- **/
  router.get("/seller/:email",verifyFBtoken, async (req, res) => {
    try {
      const email = req.params.email.toLowerCase().trim();

      const payments = await paymentsCollection
        .find({ "cartItems.sellerEmail": email })
        .sort({ date: -1 })
        .toArray();

      const sellerItems = [];
      payments.forEach((payment) => {
        (payment.cartItems || []).forEach((item) => {
          if ((item.sellerEmail || "").toLowerCase().trim() === email) {
            sellerItems.push({
              _id: payment._id,
              transactionId: payment.transactionId || "N/A",
              medicineName: item.name || "Unnamed",
              buyerEmail: payment.buyerEmail,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              totalAmount: (item.quantity || 1) * (item.unitPrice || 0),
              status: payment.status || "pending",
              date: payment.date,
            });
          }
        });
      });

      res.status(200).send(sellerItems);
    } catch (error) {
      console.error("Error fetching seller payments:", error);
      res
        .status(500)
        .send({ message: "Failed to fetch seller payments", error });
    }
  });

  /** ---------- Admin Summary ---------- **/
  router.get("/summary/admin", async (_req, res) => {
    try {
      const allPayments = await paymentsCollection.find().toArray();

      const paidTotal = allPayments
        .filter((p) => (p.status || "").toLowerCase() === "paid")
        .reduce((sum, p) => sum + (p.totalPrice || 0), 0);

      const pendingTotal = allPayments
        .filter((p) => {
          const status = (p.status || "").toLowerCase();
          return status === "pending" || status === "unpaid";
        })
        .reduce((sum, p) => sum + (p.totalPrice || 0), 0);

      res.send({ paidTotal, pendingTotal });
    } catch (error) {
      console.error("Error fetching admin summary:", error);
      res.status(500).send({ message: "Failed to fetch summary", error });
    }
  });

  /** ---------- Seller Summary ---------- **/
  router.get("/summary/seller/:email", async (req, res) => {
    try {
      const email = req.params.email.toLowerCase();

      const sellerPayments = await paymentsCollection
        .find({ "cartItems.sellerEmail": email })
        .toArray();

      let paidTotal = 0;
      let pendingTotal = 0;

      sellerPayments.forEach((payment) => {
        (payment.cartItems || []).forEach((item) => {
          if ((item.sellerEmail || "").toLowerCase() === email) {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            const status = (payment.status || "").toLowerCase();

            if (status === "paid") {
              paidTotal += itemTotal;
            } else if (status === "pending" || status === "unpaid") {
              pendingTotal += itemTotal;
            }
          }
        });
      });

      res.send({ paidTotal, pendingTotal });
    } catch (error) {
      console.error("Error fetching seller summary:", error);
      res
        .status(500)
        .send({ message: "Failed to fetch seller summary", error });
    }
  });

  return router;
};
