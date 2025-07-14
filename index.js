const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
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

async function run() {
  try {
    await client.connect();
    const db = client.db("medicineDB");
    const usersCollection = db.collection("user");
    const medicinesCollection = db.collection("medicines");
    const cartCollection = db.collection("cart");
    const paymentsCollection = db.collection("payments");
    const ordersCollection = db.collection("orders");
    const reviewsCollection = db.collection("reviews");
    const adsCollection = db.collection("advertisements");
    const locationCollection = db.collection("delivery_locations");

    // ✅ USERS ROUTES
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

    // ✅ MEDICINES ROUTES
    app.post("/medicines", async (req, res) => {
      const result = await medicinesCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/medicines", async (req, res) => {
      const result = await medicinesCollection.find().toArray();
      res.send(result);
    });

    app.get("/medicines/:id", async (req, res) => {
      const result = await medicinesCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    app.get("/medicines/seller/:email", async (req, res) => {
      const result = await medicinesCollection
        .find({ sellerEmail: req.params.email })
        .toArray();
      res.send(result);
    });

    app.delete("/medicines/:id", async (req, res) => {
      const result = await medicinesCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // ✅ CART ROUTES
    app.post("/cart", async (req, res) => {
      const result = await cartCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/cart/:email", async (req, res) => {
      const result = await cartCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });

    app.delete("/cart/:id", async (req, res) => {
      const result = await cartCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // ✅ PAYMENTS ROUTES
    app.post("/payments", async (req, res) => {
      const result = await paymentsCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/payments/:email", async (req, res) => {
      const result = await paymentsCollection
        .find({ email: req.params.email })
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/payments", async (req, res) => {
      const result = await paymentsCollection
        .find()
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    // ✅ ORDERS ROUTES
    app.post("/orders", async (req, res) => {
      const result = await ordersCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/orders/user/:email", async (req, res) => {
      const result = await ordersCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });

    app.get("/orders", async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result);
    });

    // ✅ REVIEWS ROUTES
    app.post("/reviews", async (req, res) => {
      const result = await reviewsCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/reviews/:medId", async (req, res) => {
      const result = await reviewsCollection
        .find({ medicineId: req.params.medId })
        .toArray();
      res.send(result);
    });

    // ✅ ADS ROUTES
    app.post("/advertisements", async (req, res) => {
      const result = await adsCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/advertisements", async (req, res) => {
      const result = await adsCollection.find().toArray();
      res.send(result);
    });

    app.delete("/advertisements/:id", async (req, res) => {
      const result = await adsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // ✅ DELIVERY LOCATIONS ROUTE
    app.get("/delivery-locations", async (req, res) => {
      const result = await locationCollection.find().toArray();
      res.send(result);
    });
    // GET all categories
    app.get("/categories", async (req, res) => {
      const categories = await categoriesCollection.find().toArray();
      res.send(categories);
    });

    // POST new category
    app.post("/categories", async (req, res) => {
      const newCategory = req.body; // expect { name: "Category Name" }
      const result = await categoriesCollection.insertOne(newCategory);
      res.status(201).send(result);
    });

    // DELETE category by ID
    app.delete("/categories/:id", async (req, res) => {
      const result = await categoriesCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("medicine server side getting a start");
});
app.listen(port, () => {
  console.log(`server is the runnig at:${port}`);
});
