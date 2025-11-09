const express = require("express");
const router = express.Router();
const LoyaltyProgram = require("../models/LoyaltyProgram");
const Customer = require("../models/Customer");
const Restaurant = require("../models/Restaurant");
const { body, validationResult } = require("express-validator");

// Get loyalty program
router.get("/program", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    let loyaltyProgram = await LoyaltyProgram.findOne({
      restaurantId: restaurant._id,
    });

    if (!loyaltyProgram) {
      // Create default loyalty program
      loyaltyProgram = new LoyaltyProgram({
        restaurantId: restaurant._id,
        name: `${restaurant.name} Loyalty Program`,
        description:
          "Earn points with every purchase and redeem amazing rewards!",
      });
      await loyaltyProgram.save();
    }

    res.json({ success: true, program: loyaltyProgram });
  } catch (error) {
    console.error("Get loyalty program error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update loyalty program
router.put("/program", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const loyaltyProgram = await LoyaltyProgram.findOneAndUpdate(
      { restaurantId: restaurant._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!loyaltyProgram) {
      return res
        .status(404)
        .json({ success: false, message: "Loyalty program not found" });
    }

    res.json({ success: true, program: loyaltyProgram });
  } catch (error) {
    console.error("Update loyalty program error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get rewards
router.get("/rewards", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const loyaltyProgram = await LoyaltyProgram.findOne({
      restaurantId: restaurant._id,
    });

    if (!loyaltyProgram) {
      return res
        .status(404)
        .json({ success: false, message: "Loyalty program not found" });
    }

    res.json({ success: true, rewards: loyaltyProgram.rewards });
  } catch (error) {
    console.error("Get rewards error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create reward
router.post(
  "/rewards",
  [
    body("name").notEmpty().withMessage("Reward name is required"),
    body("pointsCost").isNumeric().withMessage("Points cost must be a number"),
    body("rewardType")
      .isIn(["discount", "freeItem", "cashback", "custom"])
      .withMessage("Invalid reward type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
      if (!restaurant) {
        return res
          .status(404)
          .json({ success: false, message: "Restaurant not found" });
      }

      const loyaltyProgram = await LoyaltyProgram.findOne({
        restaurantId: restaurant._id,
      });

      if (!loyaltyProgram) {
        return res
          .status(404)
          .json({ success: false, message: "Loyalty program not found" });
      }

      loyaltyProgram.rewards.push(req.body);
      await loyaltyProgram.save();

      const newReward =
        loyaltyProgram.rewards[loyaltyProgram.rewards.length - 1];
      res.status(201).json({ success: true, reward: newReward });
    } catch (error) {
      console.error("Create reward error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Update reward
router.put("/rewards/:rewardId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const loyaltyProgram = await LoyaltyProgram.findOne({
      restaurantId: restaurant._id,
    });

    if (!loyaltyProgram) {
      return res
        .status(404)
        .json({ success: false, message: "Loyalty program not found" });
    }

    const reward = loyaltyProgram.rewards.id(req.params.rewardId);
    if (!reward) {
      return res
        .status(404)
        .json({ success: false, message: "Reward not found" });
    }

    Object.assign(reward, req.body);
    await loyaltyProgram.save();

    res.json({ success: true, reward });
  } catch (error) {
    console.error("Update reward error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete reward
router.delete("/rewards/:rewardId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const loyaltyProgram = await LoyaltyProgram.findOne({
      restaurantId: restaurant._id,
    });

    if (!loyaltyProgram) {
      return res
        .status(404)
        .json({ success: false, message: "Loyalty program not found" });
    }

    loyaltyProgram.rewards.pull(req.params.rewardId);
    await loyaltyProgram.save();

    res.json({ success: true, message: "Reward deleted successfully" });
  } catch (error) {
    console.error("Delete reward error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
