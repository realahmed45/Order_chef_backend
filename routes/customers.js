const express = require("express");
const Customer = require("../models/Customer");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Get all customers
router.get("/", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const customers = await Customer.find({
      restaurantId: restaurant._id,
    }).sort({ totalSpent: -1 });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get customer analytics
router.get("/analytics", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const totalCustomers = await Customer.countDocuments({
      restaurantId: restaurant._id,
    });
    const topCustomers = await Customer.find({ restaurantId: restaurant._id })
      .sort({ totalSpent: -1 })
      .limit(5);

    const newCustomers = await Customer.countDocuments({
      restaurantId: restaurant._id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      totalCustomers,
      newCustomers,
      topCustomers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
