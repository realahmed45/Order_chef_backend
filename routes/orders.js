const express = require("express");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const Customer = require("../models/Customer");
const router = express.Router();

// Get all orders for restaurant (Owner only)
router.get("/", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const orders = await Order.find({ restaurantId: restaurant._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new order (from website - PUBLIC endpoint)
router.post("/", async (req, res) => {
  try {
    const { restaurantId, customer, items, orderType, tableNumber } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Calculate total
    const totalAmount = items.reduce((total, item) => {
      const modifiersTotal =
        item.modifiers?.reduce(
          (modTotal, mod) => modTotal + (mod.price || 0),
          0
        ) || 0;
      return total + (item.price + modifiersTotal) * item.quantity;
    }, 0);

    const order = new Order({
      restaurantId,
      customer,
      items,
      orderType,
      tableNumber,
      totalAmount,
      estimatedReadyTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
    });

    await order.save();

    // Update or create customer
    if (customer.phone) {
      await Customer.findOneAndUpdate(
        { restaurantId, phone: customer.phone },
        {
          $set: { name: customer.name, email: customer.email },
          $inc: {
            totalOrders: 1,
            totalSpent: totalAmount,
            loyaltyPoints: Math.floor(totalAmount),
          },
          $set: { lastOrderDate: new Date() },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update order status (Owner only)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const updateData = { status };
    if (status === "ready") {
      updateData.actualReadyTime = new Date();
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get orders for kitchen display (Owner only)
router.get("/kitchen/active", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const orders = await Order.find({
      restaurantId: restaurant._id,
      status: { $in: ["confirmed", "preparing"] },
    }).sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
