const express = require("express");
const { ObjectId } = require("mongodb");
const verifyFBtoken = require("../verifyFBtoken/midleware/verifyFBtoken");

module.exports = (categoryCollection, medicineCollection) => {
  const router = express.Router();
  const DEFAULT_IMAGE = "https://i.ibb.co/default-category.png";

  // ---------- Get All Categories ----------
  router.get("/", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 0;
      let cursor = categoryCollection.find();
      if (limit > 0) cursor = cursor.limit(limit);
      const result = await cursor.toArray();
      res.send(result);
    } catch (err) {
      res
        .status(500)
        .send({ message: "Failed to fetch categories", error: err.message });
    }
  });

  // ---------- Get Categories with Medicine Count ----------
  router.get("/with-count", async (req, res) => {
    try {
      const categories = await categoryCollection.find().toArray();
      const data = await Promise.all(
        categories.map(async (cat) => {
          const count = await medicineCollection.countDocuments({
            category: { $regex: `^${cat.categoryName}$`, $options: "i" },
          });
          return {
            _id: cat._id,
            categoryName: cat.categoryName, // Original
            categoryNameUpper: cat.categoryName.toUpperCase(), // Uppercase
            categoryNameLower: cat.categoryName.toLowerCase(), // Lowercase
            image: cat.image || DEFAULT_IMAGE,
            medicineCount: count,
          };
        })
      );
      res.send(data);
    } catch (err) {
      res.status(500).send({
        message: "Failed to fetch categories with medicine count",
        error: err.message,
      });
    }
  });

  // ---------- Get Medicines by CategoryId ----------
  router.get("/:categoryId/medicines",async (req, res) => {
    try {
      const { categoryId } = req.params;
      if (!ObjectId.isValid(categoryId)) {
        return res.status(400).send({ message: "Invalid category ID" });
      }
      const category = await categoryCollection.findOne({
        _id: new ObjectId(categoryId),
      });
      if (!category) {
        return res.status(404).send({ message: "Category not found" });
      }
      const medicines = await medicineCollection
        .find({
          category: { $regex: `^${category.categoryName}$`, $options: "i" },
        })
        .toArray();
      res.send({ category, medicines });
    } catch (err) {
      res.status(500).send({
        message: "Failed to fetch medicines by category",
        error: err.message,
      });
    }
  });

  // ---------- Create New Category ----------
  router.post("/",verifyFBtoken, async (req, res) => {
    try {
      const query = req.body;
      const result = await categoryCollection.insertOne(query);
      res.send(result);
    } catch (err) {
      res
        .status(500)
        .send({ message: "Failed to create category", error: err.message });
    }
  });

  // ---------- Update Category ----------
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid category ID" });
      }

      const existing = await categoryCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!existing) {
        return res.status(404).send({ message: "Category not found" });
      }

      const { categoryName, image, ...rest } = req.body || {};
      const updateData = {};
      if (categoryName) updateData.categoryName = categoryName.trim();
      if (image) updateData.image = image;
      Object.assign(updateData, rest);

      const result = await categoryCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      // Cascade rename in medicines if categoryName changed
      if (categoryName && medicineCollection) {
        await medicineCollection.updateMany(
          { category: existing.categoryName.toLowerCase() },
          { $set: { category: categoryName.trim().toLowerCase() } }
        );
      }

      res.send({
        message: "Category updated successfully",
        modifiedCount: result.modifiedCount,
      });
    } catch (err) {
      res
        .status(500)
        .send({ message: "Failed to update category", error: err.message });
    }
  });

  // ---------- Delete Category ----------
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid category ID" });
      }
      const result = await categoryCollection.deleteOne({
        _id: new ObjectId(id),
      });
      if (result.deletedCount === 0) {
        return res.status(404).send({ message: "Category not found" });
      }
      res.send({ message: "Category deleted successfully" });
    } catch (err) {
      res
        .status(500)
        .send({ message: "Failed to delete category", error: err.message });
    }
  });

  return router;
};
