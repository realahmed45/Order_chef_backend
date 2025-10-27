const express = require("express");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Get dashboard analytics
router.get("/dashboard", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's orders
    const todaysOrders = await Order.find({
      restaurantId: restaurant._id,
      createdAt: { $gte: today },
    });

    const totalRevenue = todaysOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const totalOrders = todaysOrders.length;

    // Popular items
    const popularItems = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          count: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Order status counts
    const activeOrders = await Order.countDocuments({
      restaurantId: restaurant._id,
      status: { $in: ["pending", "confirmed", "preparing"] },
    });

    res.json({
      todaysStats: {
        revenue: totalRevenue,
        orders: totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      popularItems,
      activeOrders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
