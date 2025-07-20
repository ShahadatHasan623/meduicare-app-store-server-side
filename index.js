const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.Pyment_GateWay);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.off1efx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ✅ Import Routes
const userRoutes = require("./routes/userRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const advertisementRoutes = require("./routes/advertisementRoutes");
const categoryRoutes = require("./routes/categoryRoutes"); 
const paymentRoutes = require("./routes/paymentRoutes");

async function run() {
  try {
    await client.connect();

    const db = client.db("medicineDB");

    // ✅ Collections
    const usersCollection = db.collection("users");
    const medicinesCollection = db.collection("medicines");
    const advertisementsCollection = db.collection("advertisements");
    const paymentsCollection = db.collection("payments");
    const categoryCollection = db.collection("categories");

    // ✅ Stripe Payment Intent API
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;
        console.log("Incoming amount:", amount, "type:", typeof amount);

        if (!amount || !Number.isInteger(amount) || amount <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount, // must be integer in cents
          currency: "usd",
          automatic_payment_methods: { enabled: true },
        });

        res.send({ clientSecret: paymentIntent.client_secret });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: err?.message || "Stripe error" });
      }
    });

    // ✅ Use Routes
    app.use("/users", userRoutes(usersCollection));
    app.use("/medicines", medicineRoutes(medicinesCollection));
    app.use("/advertisements", advertisementRoutes(advertisementsCollection, medicinesCollection));
    app.use("/categories", categoryRoutes(categoryCollection, medicinesCollection));

    app.use("/payments", paymentRoutes(paymentsCollection));

    console.log("✅ Connected to MongoDB and routes set");
  } catch (err) {
    console.error("Error connecting to DB:", err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Medicine E-commerce Server is Running");
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
