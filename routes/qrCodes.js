const express = require("express");
const router = express.Router();
const QRCode = require("../models/QRcode");
const Restaurant = require("../models/Restaurant");
const qrcode = require("qrcode");
const { body, validationResult } = require("express-validator");

// Get all QR codes
router.get("/", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const qrCodes = await QRCode.find({ restaurantId: restaurant._id }).sort({
      tableNumber: 1,
    });

    res.json({ success: true, qrCodes });
  } catch (error) {
    console.error("Get QR codes error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Generate QR code for table
router.post(
  "/generate",
  [
    body("tableNumber").notEmpty().withMessage("Table number is required"),
    body("tableName").notEmpty().withMessage("Table name is required"),
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

      const { tableNumber, tableName, seatingCapacity, location, section } =
        req.body;

      // Check if table already exists
      const existingQR = await QRCode.findOne({
        restaurantId: restaurant._id,
        tableNumber,
      });

      if (existingQR) {
        return res.status(400).json({
          success: false,
          message: "QR code for this table already exists",
        });
      }

      // Generate ordering URL
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const orderingUrl = `${baseUrl}/order/${restaurant._id}?table=${tableNumber}`;

      // Generate QR code
      const qrCodeData = await qrcode.toDataURL(orderingUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      const qrCodeRecord = new QRCode({
        restaurantId: restaurant._id,
        tableNumber,
        tableName,
        qrCode: qrCodeData,
        orderingUrl,
        seatingCapacity: seatingCapacity || 4,
        location: location || "indoor",
        section: section || "main",
        customization: {
          primaryColor: "#F97316",
          welcomeMessage: `Welcome to ${restaurant.name}!`,
          instructions:
            "Scan this QR code to view our menu and place your order.",
        },
      });

      await qrCodeRecord.save();

      res.status(201).json({ success: true, qrCode: qrCodeRecord });
    } catch (error) {
      console.error("Generate QR code error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Update QR code
router.put("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const qrCodeRecord = await QRCode.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!qrCodeRecord) {
      return res
        .status(404)
        .json({ success: false, message: "QR code not found" });
    }

    res.json({ success: true, qrCode: qrCodeRecord });
  } catch (error) {
    console.error("Update QR code error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete QR code
router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const qrCodeRecord = await QRCode.findOneAndDelete({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });

    if (!qrCodeRecord) {
      return res
        .status(404)
        .json({ success: false, message: "QR code not found" });
    }

    res.json({ success: true, message: "QR code deleted successfully" });
  } catch (error) {
    console.error("Delete QR code error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get QR code analytics
router.get("/:id/analytics", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const qrCodeRecord = await QRCode.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });

    if (!qrCodeRecord) {
      return res
        .status(404)
        .json({ success: false, message: "QR code not found" });
    }

    // Get order analytics for this table (would need to implement in Order model)
    const analytics = {
      ...qrCodeRecord.analytics,
      conversionRate:
        qrCodeRecord.analytics.totalScans > 0
          ? (
              (qrCodeRecord.analytics.totalOrders /
                qrCodeRecord.analytics.totalScans) *
              100
            ).toFixed(2)
          : 0,
      averageOrderValue:
        qrCodeRecord.analytics.totalOrders > 0
          ? (
              qrCodeRecord.analytics.totalRevenue /
              qrCodeRecord.analytics.totalOrders
            ).toFixed(2)
          : 0,
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error("Get QR analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Track QR code scan (public endpoint)
router.post("/:id/scan", async (req, res) => {
  try {
    const qrCodeRecord = await QRCode.findById(req.params.id);

    if (!qrCodeRecord || !qrCodeRecord.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "QR code not found or inactive" });
    }

    await qrCodeRecord.recordScan();

    res.json({
      success: true,
      message: "Scan recorded",
      orderingUrl: qrCodeRecord.orderingUrl,
    });
  } catch (error) {
    console.error("Track scan error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Bulk generate QR codes
router.post(
  "/bulk-generate",
  [
    body("tables").isArray().withMessage("Tables must be an array"),
    body("tables.*.tableNumber")
      .notEmpty()
      .withMessage("Table number is required"),
    body("tables.*.tableName").notEmpty().withMessage("Table name is required"),
  ],
  async (req, res) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res
          .status(400)
          .json({ success: false, errors: validationErrors.array() });
      }

      const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
      if (!restaurant) {
        return res
          .status(404)
          .json({ success: false, message: "Restaurant not found" });
      }

      const { tables } = req.body;
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const createdQRCodes = [];
      const errors = [];

      for (const table of tables) {
        try {
          // Check if table already exists
          const existingQR = await QRCode.findOne({
            restaurantId: restaurant._id,
            tableNumber: table.tableNumber,
          });

          if (existingQR) {
            errors.push(`Table ${table.tableNumber} already has a QR code`);
            continue;
          }

          const orderingUrl = `${baseUrl}/order/${restaurant._id}?table=${table.tableNumber}`;
          const qrCodeData = await qrcode.toDataURL(orderingUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });

          const qrCodeRecord = new QRCode({
            restaurantId: restaurant._id,
            tableNumber: table.tableNumber,
            tableName: table.tableName,
            qrCode: qrCodeData,
            orderingUrl,
            seatingCapacity: table.seatingCapacity || 4,
            location: table.location || "indoor",
            section: table.section || "main",
            customization: {
              primaryColor: "#F97316",
              welcomeMessage: `Welcome to ${restaurant.name}!`,
              instructions:
                "Scan this QR code to view our menu and place your order.",
            },
          });

          await qrCodeRecord.save();
          createdQRCodes.push(qrCodeRecord);
        } catch (error) {
          errors.push(
            `Failed to create QR code for table ${table.tableNumber}: ${error.message}`
          );
        }
      }

      res.status(201).json({
        success: true,
        qrCodes: createdQRCodes,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Bulk generate QR codes error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

module.exports = router;
