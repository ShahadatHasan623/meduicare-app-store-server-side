const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const stripe = require("stripe")(process.env.Pyment_GateWay);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.off1efx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Routes
const userRoutes = require("./routes/userRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const advertisementRoutes = require("./routes/advertisementRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const newsletterRoutes = require("./routes/newsletter");
const faqRoutes = require("./routes/faqRoutes");

let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  }

  const db = client.db("medicineDB");

  const usersCollection = db.collection("users");
  const medicinesCollection = db.collection("medicines");
  const advertisementsCollection = db.collection("advertisements");
  const paymentsCollection = db.collection("payments");
  const categoryCollection = db.collection("categories");
  const faqCollection = db.collection("faqs");

  // Routes
  app.use("/faqs", faqRoutes(faqCollection));
  app.use("/newsletter", newsletterRoutes(db));

  app.use("/users", userRoutes(usersCollection));
  app.use("/medicines", medicineRoutes(medicinesCollection));

  app.use(
    "/advertisements",
    advertisementRoutes(
      advertisementsCollection,
      medicinesCollection
    )
  );

  app.use(
    "/categories",
    categoryRoutes(
      categoryCollection,
      medicinesCollection
    )
  );

  app.use(
    "/payments",
    paymentRoutes(
      paymentsCollection,
      usersCollection
    )
  );
}

// Stripe Payment Intent
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;

    console.log(
      "Incoming amount:",
      amount,
      "type:",
      typeof amount
    );

    if (!amount || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err?.message || "Stripe error",
    });
  }
});

// Home route
app.get("/", async (req, res) => {
  try {
    await connectDB();

    res.send("Medicine E-commerce Server is Running");
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// Initialize database/routes
connectDB().catch((error) => {
  console.error("❌ Database initialization failed:", error);
});

// ❌ DO NOT use app.listen() on Vercel
// app.listen(port, ...);

// ✅ Export app for Vercel
module.exports = app;