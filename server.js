const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/orderchef")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

// **FIXED: Consistent JWT Secret**
const JWT_SECRET =
  process.env.JWT_SECRET || "orderchef-super-secret-key-2024-must-be-32-chars";

// Auth middleware
const auth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token signature" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    res.status(401).json({ message: "Authentication failed" });
  }
};

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/onboarding", auth, require("./routes/onboarding"));
app.use("/api/website", require("./routes/website"));
app.use("/api/menus", auth, require("./routes/menus"));
app.use("/api/orders", auth, require("./routes/orders"));
app.use("/api/customers", auth, require("./routes/customers"));
app.use("/api/inventory", auth, require("./routes/inventory"));
app.use("/api/analytics", auth, require("./routes/analytics"));

// **FIXED: Load the correct deployments route file**
// If your file is named deployments-v2.js, use this:
app.use("/api/deployments", auth, require("./routes/deployments"));
// OR if your file is named deployments.js, use this:
// app.use("/api/deployments", auth, require("./routes/deployments"));

// **NEW: Public menu endpoint**
app.get("/api/public/menu/:restaurantId", async (req, res) => {
  try {
    const MenuItem = require("./models/Menu");
    const { restaurantId } = req.params;

    const menuItems = await MenuItem.find({
      restaurantId,
      isAvailable: true,
    }).select("name description price category image");

    res.json({
      success: true,
      items: menuItems,
    });
  } catch (error) {
    console.error("Menu fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu",
      error: error.message,
    });
  }
});

// Public order endpoint
app.post("/api/public/orders", async (req, res) => {
  try {
    const Order = require("./models/Order");
    const Restaurant = require("./models/Restaurant");
    const Customer = require("./models/Customer");

    const { restaurantId, customer, items, orderType, tableNumber } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const totalAmount = items.reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );

    const order = new Order({
      restaurantId,
      customer,
      items,
      orderType: orderType || "takeaway",
      tableNumber,
      totalAmount,
      estimatedReadyTime: new Date(Date.now() + 30 * 60000),
    });

    await order.save();

    if (customer && customer.phone) {
      await Customer.findOneAndUpdate(
        { restaurantId, phone: customer.phone },
        {
          $set: {
            name: customer.name,
            email: customer.email || "",
            lastOrderDate: new Date(),
          },
          $inc: {
            totalOrders: 1,
            totalSpent: totalAmount,
            loyaltyPoints: Math.floor(totalAmount),
          },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        estimatedReadyTime: order.estimatedReadyTime,
      },
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// **NEW: Serve static websites (IMPORTANT!)**
const path = require("path");
const WEBSITES_DIR = path.join(__dirname, "hosted-websites");
app.use("/websites", express.static(WEBSITES_DIR));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "Server is running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 OrderChef API running on port ${PORT}`);
  console.log(`🔑 JWT Secret: ${JWT_SECRET ? "✅ Set" : "❌ Not set"}`);
  console.log(
    `🔧 Vercel Token: ${process.env.VERCEL_TOKEN ? "✅ Set" : "❌ Not set"}`
  );
  console.log(`📁 Websites directory: ${WEBSITES_DIR}`);
  console.log(`🌐 Websites URL: http://localhost:${PORT}/websites/`);
});
