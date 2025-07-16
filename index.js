const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.PYMENT_GATEWAY);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.off1efx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const userRoutes = require("./routes/userRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const advertisementRoutes = require("./routes/advertisementRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

async function run() {
  try {
    await client.connect();

    const db = client.db("medicineDB");
    const usersCollection = db.collection("users");
    const medicinesCollection = db.collection("medicines");
    const advertisementsCollection = db.collection("advertisements");
    const paymentsCollection = db.collection("payments");
    const categoryCollection = db.collection("categories");

    // payment intent route - keep here or in paymentRoutes.js
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

    app.use("/users", userRoutes(usersCollection));
    app.use("/medicines", medicineRoutes(medicinesCollection));
    app.use("/advertisements", advertisementRoutes(advertisementsCollection));
    app.use("/categories", categoryRoutes(categoryCollection));
    app.use("/payments", paymentRoutes(paymentsCollection));

    console.log("✅ Connected to MongoDB and routes set");
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Medicine E-commerce Server is Running");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
