const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const verifyFBtoken = require("../verifyFBtoken/midleware/verifyFBtoken");

// inject advertisementsCollection from main server file when using this route
module.exports = (advertisementsCollection) => {
  // Seller: Get all medicines referred by this seller
  router.get("/seller/:sellerEmail", async (req, res) => {
    try {
      const { sellerEmail } = req.params;
      if (!sellerEmail) {
        return res.status(400).json({ error: "Seller email is required" });
      }
      const ads = await advertisementsCollection.find({ sellerEmail }).toArray();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching seller advertisements:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Seller: Add new advertisement request
  router.post("/seller/add",verifyFBtoken, async (req, res) => {
    try {
      const { medicineName, medicineImage, description, sellerEmail } = req.body;

      if (!medicineName || !medicineImage || !description || !sellerEmail) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newAd = {
        medicineName,
        medicineImage,
        description,
        sellerEmail,
        isOnSlider: false,
        createdAt: new Date(),  
      };

      const result = await advertisementsCollection.insertOne(newAd);
      res.status(201).json({
        message: "Advertisement added successfully",
        adId: result.insertedId,
      });
    } catch (error) {
      console.error("Error adding advertisement:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin: Get all advertisements
  router.get("/admin/all",verifyFBtoken, async (req, res) => {
    try {
      const ads = await advertisementsCollection.find({}).toArray();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching all advertisements:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin: Toggle add/remove from slider
  router.patch("/admin/toggle-slider/:adId", async (req, res) => {
    try {
      const { adId } = req.params;

      if (!ObjectId.isValid(adId)) {
        return res.status(400).json({ error: "Invalid advertisement ID" });
      }

      const adObjectId = new ObjectId(adId);
      const ad = await advertisementsCollection.findOne({ _id: adObjectId });

      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      const updatedStatus = !ad.isOnSlider;

      const updateResult = await advertisementsCollection.updateOne(
        { _id: adObjectId },
        { $set: { isOnSlider: updatedStatus } }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(500).json({ error: "Failed to update advertisement status" });
      }

      res.json({
        message: `Advertisement ${updatedStatus ? "added to" : "removed from"} slider`,
        isOnSlider: updatedStatus,
      });
    } catch (error) {
      console.error("Error toggling advertisement slider status:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Homepage: Get all advertisements that are currently on the slider
  router.get("/slider", async (req, res) => {
    try {
      const adsOnSlider = await advertisementsCollection.find({ isOnSlider: true }).toArray();
      res.json(adsOnSlider);
    } catch (error) {
      console.error("Error fetching slider advertisements:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};
