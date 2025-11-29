const express = require("express");
const MenuItem = require("../models/Menu");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Get menu items for a specific restaurant (PUBLIC - no auth required)
router.get("/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, isAvailable, search } = req.query;

    // Build query
    let query = { restaurantId, isActive: true };

    if (category && category !== "All") {
      query.category = category;
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch menu items
    const items = await MenuItem.find(query)
      .sort({ category: 1, name: 1 })
      .lean();

    // Get restaurant info
    const restaurant = await Restaurant.findById(restaurantId)
      .select("name cuisineType")
      .lean();

    res.json({
      success: true,
      items,
      count: items.length,
      restaurant,
    });
  } catch (error) {
    console.error("Get public menu error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu",
      error: error.message,
    });
  }
});

// Get categories for a restaurant (PUBLIC)
router.get("/:restaurantId/categories", async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const categories = await MenuItem.distinct("category", {
      restaurantId,
      isActive: true,
    });

    res.json({
      success: true,
      categories: ["All", ...categories],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

module.exports = router;
