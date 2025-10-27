const express = require("express");
const MenuItem = require("../models/Menu");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Get restaurant menu
router.get("/", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create menu item
router.post("/", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menuItem = new MenuItem({
      restaurantId: restaurant._id,
      ...req.body,
    });

    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update menu item
router.put("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      req.body,
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete menu item
router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
