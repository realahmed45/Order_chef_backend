const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const authenticate = require("../middleware/authenticate");

/**
 * POST /api/orders/place
 * Place order from deployed website (NO AUTH REQUIRED - PUBLIC)
 */
router.post("/place", async (req, res) => {
  try {
    const { restaurantId, items, customerInfo, total } = req.body;

    console.log("📝 New order received for restaurant:", restaurantId);

    if (!restaurantId || !items || !customerInfo || !total) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1;
    const deliveryFee = 5.99;
    const finalAmount = subtotal + tax + deliveryFee;

    // Create order
    const order = new Order({
      restaurantId: restaurantId,
      customer: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email || "",
        address: {
          street: customerInfo.address || "",
          city: customerInfo.city || "",
          state: customerInfo.state || "",
          zipCode: customerInfo.zipCode || "",
        },
      },
      items: items.map((item) => ({
        _id: item.id || item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        description: item.description || "",
        category: item.category || "",
      })),
      orderType: "delivery",
      paymentMethod:
        customerInfo.paymentMethod === "card" ? "card" : "cash-on-delivery",
      paymentStatus: "pending",
      totalAmount: subtotal,
      deliveryFee: deliveryFee,
      tax: tax,
      finalAmount: finalAmount,
      status: "pending",
    });

    await order.save();

    console.log("✅ Order created:", order.orderNumber);

    // TODO: Send notification to restaurant owner
    // TODO: Send confirmation email/SMS to customer

    res.json({
      success: true,
      message: "Order placed successfully!",
      orderNumber: order.orderNumber,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedTime: "30-45 minutes",
        totalAmount: finalAmount,
      },
    });
  } catch (error) {
    console.error("❌ Order placement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
});

/**
 * GET /api/orders/restaurant/:restaurantId
 * Get all orders for a restaurant (REQUIRES AUTH)
 */
router.get("/restaurant/:restaurantId", authenticate, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, limit = 50, page = 1 } = req.query;

    // Verify ownership
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (restaurant.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Build query
    const query = { restaurantId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

/**
 * GET /api/orders/:orderId
 * Get order details (REQUIRES AUTH)
 */
router.get("/:orderId", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate(
      "restaurantId",
      "name"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    res.json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
});

/**
 * PUT /api/orders/:orderId/status
 * Update order status (REQUIRES AUTH)
 */
router.put("/:orderId/status", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "out-for-delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    order.status = status;

    if (status === "ready") {
      order.actualReadyTime = new Date();
    }

    if (status === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

    await order.save();

    // TODO: Send notification to customer

    res.json({
      success: true,
      message: "Order status updated",
      order: order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/orders/:orderId
 * Delete/cancel order (REQUIRES AUTH)
 */
router.delete("/:orderId", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order in current status",
      });
    }

    order.status = "cancelled";
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
});

module.exports = router;
