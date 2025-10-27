const express = require("express");
const Inventory = require("../models/Inventory");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Get all inventory items
router.get("/", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const inventory = await Inventory.find({ restaurantId: restaurant._id });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create inventory item
router.post("/", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const inventoryItem = new Inventory({
      restaurantId: restaurant._id,
      ...req.body,
    });

    await inventoryItem.save();
    res.status(201).json(inventoryItem);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update inventory item
router.put("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const inventoryItem = await Inventory.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      req.body,
      { new: true }
    );

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json(inventoryItem);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get low stock alerts
router.get("/alerts", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const lowStockItems = await Inventory.find({
      restaurantId: restaurant._id,
      currentStock: { $lte: { $expr: "$reorderPoint" } },
    });

    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
