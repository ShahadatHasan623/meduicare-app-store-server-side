// server.js
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.PYMENT_GATEWAY);
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.off1efx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB client setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("medicineDB");
    const usersCollection = db.collection("users");
    const medicinesCollection = db.collection("medicines");
    const advertisementsCollection = db.collection("advertisements");
    const paymentsCollection = db.collection("payments");

    // 🔐 Stripe Payment Intent API
    app.post("/create-payment-intent", async (req, res) => {
      const { amountInCents } = req.body;
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          automatic_payment_methods: { enabled: true },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // ✅ USER ROUTES
    app.post("/users", async (req, res) => {
      const user = req.body;

      if (user.role === "admin") {
        return res
          .status(403)
          .send({ message: "Admin registration not allowed" });
      }

      const existing = await usersCollection.findOne({ email: user.email });
      if (existing) return res.send({ message: "User already exists" });

      const result = await usersCollection.insertOne(user);
      res.status(201).send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const result = await usersCollection.findOne({ email: req.params.email });
      res.send(result);
    });

    app.patch("/users/role/:id", async (req, res) => {
      const { role } = req.body;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { role } }
      );
      res.send(result);
    });

    // Seller Routes
    app.post("/medicines", async (req, res) => {
      const data = req.body;
      data.status = "available";
      const result = await medicinesCollection.insertOne(data);
      res.send(result);
    });

    app.get("/medicines",  async (req, res) => {
      const email = req.query.sellerEmail;
      const result = await medicinesCollection
        .find({ sellerEmail: email })
        .toArray();
      res.send(result);
    });

    app.delete("/medicines/:id", async (req, res) => {
      const id = req.params.id;
      const result = await medicinesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Seller Payments
    app.get("/seller-payments/:email", async (req, res) => {
      const result = await paymentsCollection
        .find({ sellerEmail: req.params.email })
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    // Advertisement
    app.post("/advertisements", async (req, res) => {
      const data = req.body;
      data.status = "pending";
      const result = await advertisementsCollection.insertOne(data);
      res.send(result);
    });

    app.get("/advertisements",  async (req, res) => {
      const result = await advertisementsCollection.find().toArray();
      res.send(result);
    });

    app.get("/advertisements/:email", async (req, res) => {
      const result = await advertisementsCollection
        .find({ sellerEmail: req.params.email })
        .toArray();
      res.send(result);
    });

    app.patch(
      "/advertisements/toggle-slide/:id",
      async (req, res) => {
        const { inSlider } = req.body;
        const result = await advertisementsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { inSlider } }
        );
        res.send(result);
      }
    );

    // Category Routes
    app.get("/categories", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    app.post("/categories", async (req, res) => {
      const category = req.body;
      const result = await categoryCollection.insertOne(category);
      res.send(result);
    });

    app.patch("/categories/:id", async (req, res) => {
      const data = req.body;
      const result = await categoryCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: data }
      );
      res.send(result);
    });

    app.delete("/categories/:id", async (req, res) => {
      const result = await categoryCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Payment Management
    app.get("/payments", async (req, res) => {
      const result = await paymentsCollection.find().toArray();
      res.send(result);
    });

    app.patch("/payments/:id",async (req, res) => {
      const result = await paymentsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "paid" } }
      );
      res.send(result);
    });

    // Sales Report
    app.get("/sales-report", async (req, res) => {
      const { startDate, endDate } = req.query;
      let filter = {};
      if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      const result = await paymentsCollection
        .find(filter)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });
    // ✅ Check MongoDB connection
    await client.db("admin").command({ ping: 1 });
    console.log(" Connected to MongoDB successfully!");
  } finally {
    // Leave client open for re-use
    // await client.close();
  }
}

// Run the server
run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send(" Medicine E-commerce Server is Running");
});

app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});
