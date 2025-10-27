const express = require("express");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Get user's restaurant
router.get("/my-restaurant", async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const restaurant = await Restaurant.findOne({ ownerId });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create restaurant
router.post("/", async (req, res) => {
  try {
    const { name, description, address, contact, cuisineType } = req.body;
    const ownerId = req.user.userId;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const restaurant = new Restaurant({
      ownerId,
      name,
      slug,
      description,
      address,
      contact,
      cuisineType,
    });

    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
