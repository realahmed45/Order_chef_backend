const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const Restaurant = require("../models/Restaurant");
const { body, validationResult } = require("express-validator");

// Get all notifications
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const query = {
      restaurantId: restaurant._id,
      recipientId: req.user.userId,
      recipientModel: "User",
    };

    if (status) query.status = status;
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      status: { $ne: "read" },
    });

    res.json({
      success: true,
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id,
      recipientId: req.user.userId,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    await notification.markAsRead();

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    await Notification.updateMany(
      {
        restaurantId: restaurant._id,
        recipientId: req.user.userId,
        status: { $ne: "read" },
      },
      {
        status: "read",
        readAt: new Date(),
      }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get notification settings
router.get("/settings", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    // Get settings from restaurant model or create defaults
    const settings = restaurant.notificationSettings || {
      email: {
        orderNew: true,
        orderCancelled: true,
        inventoryLow: true,
        staffClockIn: false,
        dailyReport: true,
      },
      sms: {
        orderNew: false,
        orderCancelled: false,
        inventoryLow: true,
        staffClockIn: false,
        dailyReport: false,
      },
      push: {
        orderNew: true,
        orderCancelled: true,
        inventoryLow: true,
        staffClockIn: true,
        dailyReport: false,
      },
      inApp: {
        orderNew: true,
        orderCancelled: true,
        inventoryLow: true,
        staffClockIn: true,
        dailyReport: true,
      },
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update notification settings
router.put("/settings", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    restaurant.notificationSettings = req.body;
    await restaurant.save();

    res.json({ success: true, settings: restaurant.notificationSettings });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send custom notification
router.post(
  "/send",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("message").notEmpty().withMessage("Message is required"),
    body("type").optional().isIn(["system_alert", "marketing", "custom"]),
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

      const notification = new Notification({
        restaurantId: restaurant._id,
        recipientId: req.user.userId,
        recipientModel: "User",
        type: req.body.type || "custom",
        priority: req.body.priority || "medium",
        title: req.body.title,
        message: req.body.message,
        data: req.body.data || {},
        channels: req.body.channels || { inApp: true },
        actionUrl: req.body.actionUrl,
        imageUrl: req.body.imageUrl,
        expiresAt: req.body.expiresAt,
      });

      await notification.save();

      // Send real-time notification
      const io = req.app.get("io");
      io.to(`restaurant:${restaurant._id}`).emit("notification:new", {
        restaurantId: restaurant._id,
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
        },
      });

      res.status(201).json({ success: true, notification });
    } catch (error) {
      console.error("Send notification error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      restaurantId: restaurant._id,
      recipientId: req.user.userId,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
