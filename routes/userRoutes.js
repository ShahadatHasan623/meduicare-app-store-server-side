const express = require("express");
const { ObjectId } = require("mongodb");

module.exports = (usersCollection) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
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

  router.get("/", async (req, res) => {
    const users = await usersCollection.find().toArray();
    res.send(users);
  });

  router.get("/:email", async (req, res) => {
    const result = await usersCollection.findOne({ email: req.params.email });
    res.send(result);
  });

  router.get("/:email/role", async (req, res) => {
    try {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send({ role: user?.role || "user" });
    } catch {
      res.status(500).send({ message: "Internal Server Error" });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const id = req.params.id;

      // ObjectId রূপান্তর
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 1) {
        res.send({ message: "User deleted successfully" });
      } else {
        res.status(404).send({ message: "User not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });
  router.patch("/:email/role", async (req, res) => {
    try {
      const email = req.params.email;
      const { role } = req.body;

      if (!role) {
        return res.status(400).send({ message: "Role is required" });
      }

      const result = await usersCollection.updateOne(
        { email },
        { $set: { role } }
      );

      if (result.modifiedCount === 0) {
        return res
          .status(404)
          .send({ message: "User not found or role unchanged" });
      }

      res.send({ message: "User role updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });

  return router;
};
