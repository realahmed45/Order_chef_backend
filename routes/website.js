const express = require("express");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Get restaurant website data by slug
router.get("/:slug", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
      "website.isPublished": true,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
