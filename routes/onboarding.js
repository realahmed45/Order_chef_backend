const express = require("express");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const router = express.Router();

// **FIXED: Create restaurant endpoint that matches frontend**
router.post("/restaurant", async (req, res) => {
  try {
    const { name, cuisineType, description, contact } = req.body;
    const ownerId = req.user.userId;

    // Validate required fields
    if (!name || !cuisineType) {
      return res.status(400).json({
        success: false,
        message: "Restaurant name and cuisine type are required",
      });
    }

    // Generate unique slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let counter = 1;
    let originalSlug = slug;

    while (await Restaurant.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    const restaurant = new Restaurant({
      ownerId,
      name,
      slug,
      cuisineType,
      description: description || "",
      contact: {
        phone: contact?.phone || "",
        email: contact?.email || "",
        address: {
          street: contact?.address?.street || "",
          city: contact?.address?.city || "",
          state: contact?.address?.state || "",
          zipCode: contact?.address?.zipCode || "",
        },
      },
      website: {
        subdomain: slug,
      },
    });

    await restaurant.save();

    // Update user onboarding progress
    await User.findByIdAndUpdate(ownerId, {
      $set: {
        "onboarding.restaurantCreated": true,
        "onboarding.currentStep": 2,
      },
    });

    console.log("✅ Restaurant created:", restaurant._id);

    res.status(201).json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        id: restaurant._id, // Send both for compatibility
        name: restaurant.name,
        slug: restaurant.slug,
        cuisineType: restaurant.cuisineType,
        description: restaurant.description,
        contact: restaurant.contact,
      },
      websiteUrl: `http://localhost:${
        process.env.PORT || 5000
      }/websites/${slug}/`,
      message: "Restaurant created successfully!",
    });
  } catch (error) {
    console.error("Restaurant creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// **KEEP: Original endpoint for backward compatibility**
router.post("/create-restaurant", async (req, res) => {
  try {
    const { name, cuisineType, description, phone, address } = req.body;
    const ownerId = req.user.userId;

    // Generate unique slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let counter = 1;
    let originalSlug = slug;

    while (await Restaurant.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    const restaurant = new Restaurant({
      ownerId,
      name,
      slug,
      cuisineType,
      description,
      contact: {
        phone,
        address: {
          street: address,
        },
      },
      website: {
        subdomain: slug,
      },
    });

    await restaurant.save();

    // Update user onboarding progress
    await User.findByIdAndUpdate(ownerId, {
      $set: {
        "onboarding.restaurantCreated": true,
        "onboarding.currentStep": 2,
      },
    });

    res.status(201).json({
      restaurant,
      websiteUrl: `${slug}.orderchef.com`,
      message: "Restaurant created successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update restaurant details
router.put("/update-restaurant/:id", async (req, res) => {
  try {
    const { hours, branding } = req.body;
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { $set: { hours, branding } },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Publish website
router.post("/publish-website/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      {
        $set: {
          "website.isPublished": true,
          "website.publishedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Mark onboarding as completed
    await User.findByIdAndUpdate(req.user.userId, {
      $set: {
        "onboarding.completed": true,
        "onboarding.currentStep": 3,
      },
    });

    res.json({
      restaurant,
      websiteUrl: `${restaurant.slug}.orderchef.com`,
      message: "Website published successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's restaurant
router.get("/my-restaurant", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No restaurant found for this user",
      });
    }

    res.json({
      success: true,
      restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// **NEW: Get restaurant by ID**
router.get("/restaurant/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.json({
      success: true,
      restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
