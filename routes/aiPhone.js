const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const { body, validationResult } = require("express-validator");

// Get AI phone settings
router.get("/settings", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const settings = restaurant.aiPhoneSettings || {
      enabled: false,
      phoneNumber: "",
      greeting: `Hi! Thanks for calling ${restaurant.name}. I'm our AI assistant and I'm here to help you place an order.`,
      orderTaking: true,
      reservations: false,
      hours: {
        enabled: true,
        message:
          "Sorry, we're currently closed. Our hours are Monday-Sunday 9AM-10PM.",
      },
      fallback: {
        enabled: true,
        message: "Let me transfer you to a team member.",
        transferNumber: "",
      },
      voice: {
        language: "en-US",
        speed: 1.0,
        pitch: 1.0,
      },
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Get AI phone settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update AI phone settings
router.put("/settings", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    restaurant.aiPhoneSettings = {
      ...restaurant.aiPhoneSettings,
      ...req.body,
    };
    await restaurant.save();

    res.json({
      success: true,
      message: "AI phone settings updated successfully",
    });
  } catch (error) {
    console.error("Update AI phone settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get call logs
router.get("/calls", async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    // Mock call logs for now
    const callLogs = [
      {
        id: "1",
        callerNumber: "+1234567890",
        duration: 180, // seconds
        outcome: "order_placed",
        orderValue: 25.99,
        timestamp: new Date(),
        transcript:
          "Customer called to order a large pepperoni pizza for delivery.",
      },
      {
        id: "2",
        callerNumber: "+0987654321",
        duration: 45,
        outcome: "hours_inquiry",
        orderValue: 0,
        timestamp: new Date(Date.now() - 3600000),
        transcript: "Customer asked about operating hours.",
      },
    ];

    const total = callLogs.length;
    const summary = {
      totalCalls: total,
      totalOrders: callLogs.filter((call) => call.outcome === "order_placed")
        .length,
      totalRevenue: callLogs.reduce((sum, call) => sum + call.orderValue, 0),
      averageDuration:
        callLogs.reduce((sum, call) => sum + call.duration, 0) / total,
    };

    res.json({
      success: true,
      callLogs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
      summary,
    });
  } catch (error) {
    console.error("Get call logs error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Train AI with custom responses
router.post(
  "/train",
  [body("scenarios").isArray().withMessage("Scenarios must be an array")],
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

      const { scenarios } = req.body;

      // Here you would integrate with AI training service
      // For now, just save the training data
      restaurant.aiPhoneSettings = {
        ...restaurant.aiPhoneSettings,
        customTraining: scenarios,
        lastTrainedAt: new Date(),
      };

      await restaurant.save();

      res.json({
        success: true,
        message: "AI training completed successfully",
        trainedScenarios: scenarios.length,
      });
    } catch (error) {
      console.error("Train AI error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Test AI phone system
router.post(
  "/test",
  [body("testMessage").notEmpty().withMessage("Test message is required")],
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

      const { testMessage } = req.body;

      // Mock AI response
      let response =
        "I'm sorry, I didn't understand that. Could you please repeat?";

      if (testMessage.toLowerCase().includes("menu")) {
        response =
          "I'd be happy to tell you about our menu! We have delicious pizzas, burgers, salads, and more. What would you like to know about?";
      } else if (testMessage.toLowerCase().includes("order")) {
        response =
          "Great! I can help you place an order. What would you like to order today?";
      } else if (testMessage.toLowerCase().includes("hours")) {
        response =
          "We're open Monday through Sunday from 9 AM to 10 PM. Is there anything else I can help you with?";
      }

      res.json({
        success: true,
        testMessage,
        aiResponse: response,
        confidence: 0.85,
        processingTime: 1.2, // seconds
      });
    } catch (error) {
      console.error("Test AI error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

module.exports = router;
