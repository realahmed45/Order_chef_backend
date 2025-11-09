const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Staff = require("../models/staff");
const { body, validationResult } = require("express-validator");

// Generate sales report
router.post("/sales", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const matchStage = {
      restaurantId: restaurant._id,
      status: { $ne: "cancelled" },
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const groupFormat =
      groupBy === "hour"
        ? "%Y-%m-%d-%H"
        : groupBy === "day"
        ? "%Y-%m-%d"
        : groupBy === "week"
        ? "%Y-%U"
        : groupBy === "month"
        ? "%Y-%m"
        : "%Y";

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const summary = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      report: {
        type: "sales",
        period: { startDate, endDate, groupBy },
        data: salesData,
        summary: summary[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        },
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Generate sales report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Generate customer report
router.post("/customers", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const matchStage = { restaurantId: restaurant._id };

    if (startDate || endDate) {
      matchStage.lastOrderDate = {};
      if (startDate) matchStage.lastOrderDate.$gte = new Date(startDate);
      if (endDate) matchStage.lastOrderDate.$lte = new Date(endDate);
    }

    const customerData = await Customer.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          newCustomers: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$createdAt",
                    new Date(
                      startDate || Date.now() - 30 * 24 * 60 * 60 * 1000
                    ),
                  ],
                },
                1,
                0,
              ],
            },
          },
          averageSpent: { $avg: "$totalSpent" },
          totalLoyaltyPoints: { $sum: "$loyaltyPoints" },
        },
      },
    ]);

    // Top customers by spending
    const topCustomers = await Customer.find(matchStage)
      .sort({ totalSpent: -1 })
      .limit(10)
      .select("name email phone totalSpent totalOrders lastOrderDate");

    res.json({
      success: true,
      report: {
        type: "customers",
        period: { startDate, endDate },
        data: customerData[0] || {},
        topCustomers,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Generate customer report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Generate staff report
router.post("/staff", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const staff = await Staff.find({
      restaurantId: restaurant._id,
      status: "active",
    }).select("name role department hourlyRate hireDate");

    const staffSummary = {
      totalStaff: staff.length,
      byDepartment: staff.reduce((acc, member) => {
        acc[member.department] = (acc[member.department] || 0) + 1;
        return acc;
      }, {}),
      averageHourlyRate:
        staff.reduce((sum, member) => sum + member.hourlyRate, 0) /
        staff.length,
    };

    res.json({
      success: true,
      report: {
        type: "staff",
        period: { startDate, endDate },
        data: staffSummary,
        staff,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Generate staff report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Generate inventory report
router.post("/inventory", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const Inventory = require("../models/Inventory");

    const inventory = await Inventory.find({
      restaurantId: restaurant._id,
    }).sort({ name: 1 });

    const summary = {
      totalItems: inventory.length,
      lowStockItems: inventory.filter(
        (item) => item.currentStock <= item.reorderPoint
      ).length,
      outOfStockItems: inventory.filter((item) => item.currentStock === 0)
        .length,
      totalValue: inventory.reduce(
        (sum, item) => sum + (item.currentStock * item.unitCost || 0),
        0
      ),
    };

    res.json({
      success: true,
      report: {
        type: "inventory",
        data: summary,
        inventory: inventory.map((item) => ({
          name: item.name,
          currentStock: item.currentStock,
          unit: item.unit,
          reorderPoint: item.reorderPoint,
          status:
            item.currentStock === 0
              ? "out_of_stock"
              : item.currentStock <= item.reorderPoint
              ? "low_stock"
              : "in_stock",
        })),
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Generate inventory report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get scheduled reports
router.get("/scheduled", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const scheduledReports = restaurant.scheduledReports || [];

    res.json({ success: true, scheduledReports });
  } catch (error) {
    console.error("Get scheduled reports error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Schedule report
router.post(
  "/schedule",
  [
    body("reportType")
      .isIn(["sales", "customers", "staff", "inventory"])
      .withMessage("Invalid report type"),
    body("frequency")
      .isIn(["daily", "weekly", "monthly"])
      .withMessage("Invalid frequency"),
    body("email").isEmail().withMessage("Valid email is required"),
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

      const { reportType, frequency, email, time } = req.body;

      const scheduledReport = {
        id: Date.now().toString(),
        reportType,
        frequency,
        email,
        time: time || "09:00",
        isActive: true,
        createdAt: new Date(),
        lastSent: null,
        nextSend: null,
      };

      if (!restaurant.scheduledReports) {
        restaurant.scheduledReports = [];
      }

      restaurant.scheduledReports.push(scheduledReport);
      await restaurant.save();

      res.status(201).json({
        success: true,
        message: "Report scheduled successfully",
        scheduledReport,
      });
    } catch (error) {
      console.error("Schedule report error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Download report (mock for now)
router.get("/:reportId/download", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    // In a real implementation, you would generate and return the actual file
    res.json({
      success: true,
      message: "Report download would start here",
      downloadUrl: `/api/reports/${req.params.reportId}/file`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
  } catch (error) {
    console.error("Download report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
