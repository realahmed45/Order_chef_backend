const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const { body, validationResult } = require("express-validator");

// Get payment settings
router.get("/settings", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const settings = restaurant.paymentSettings || {
      stripe: {
        enabled: false,
        publicKey: "",
        secretKey: "",
        webhookSecret: "",
      },
      acceptedMethods: ["card", "cash"],
      currency: "USD",
      taxRate: 0,
      serviceFee: 0,
      minimumOrder: 0,
    };

    const publicSettings = {
      ...settings,
      stripe: {
        enabled: settings.stripe.enabled,
        publicKey: settings.stripe.publicKey,
      },
    };

    res.json({ success: true, settings: publicSettings });
  } catch (error) {
    console.error("Get payment settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update payment settings
router.put("/settings", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    restaurant.paymentSettings = {
      ...restaurant.paymentSettings,
      ...req.body,
    };
    await restaurant.save();

    res.json({
      success: true,
      message: "Payment settings updated successfully",
    });
  } catch (error) {
    console.error("Update payment settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Process payment
router.post(
  "/process",
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("method")
      .isIn(["card", "cash", "digital_wallet"])
      .withMessage("Invalid payment method"),
    body("amount").isNumeric().withMessage("Amount must be a number"),
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

      const {
        orderId,
        method,
        amount,
        tip = 0,
        paymentDetails = {},
      } = req.body;

      const order = await Order.findOne({
        _id: orderId,
        restaurantId: restaurant._id,
      });
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const payment = new Payment({
        restaurantId: restaurant._id,
        orderId,
        customerId: order.customerId,
        method,
        provider: method === "cash" ? "manual" : "stripe",
        amount,
        currency: restaurant.paymentSettings?.currency || "USD",
        tip,
        status: method === "cash" ? "succeeded" : "pending",
        paymentDetails,
        processedAt: method === "cash" ? new Date() : null,
      });

      await payment.save();

      // Update order payment status
      order.paymentStatus = payment.status;
      order.paymentId = payment._id;
      if (payment.status === "succeeded") {
        order.status = "paid";
      }
      await order.save();

      res.status(201).json({ success: true, payment });
    } catch (error) {
      console.error("Process payment error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get payment transactions
router.get("/transactions", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method } = req.query;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const query = { restaurantId: restaurant._id };
    if (status) query.status = status;
    if (method) query.method = method;

    const transactions = await Payment.find(query)
      .populate("orderId", "orderNumber customer")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
