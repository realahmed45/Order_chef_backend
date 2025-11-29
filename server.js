const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.io Configuration
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://192.168.18.12:3000/",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Security Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

// Basic Middleware
app.use(compression());
app.use(morgan("combined"));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// File Upload Configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and documents are allowed"));
    }
  },
});

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://chatbiz50_db_user:FfNpyRNsveWu6BRo@cluster0.kcmsr1x.mongodb.net/?appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.log("❌ MongoDB connection error:", err.message));

// JWT Secret
const JWT_SECRET =
  process.env.JWT_SECRET || "orderchef-super-secret-key-2024-must-be-32-chars";

// Auth middleware
const auth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token signature" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }

    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

// Socket.io Connection Handling
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Join restaurant room
  socket.on("join:restaurant", (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
    socket.restaurantId = restaurantId;
    console.log(`👨‍🍳 User joined restaurant: ${restaurantId}`);
  });

  // Handle order events
  socket.on("order:new", (orderData) => {
    console.log("📝 New order event:", orderData);
    io.to(`restaurant:${orderData.restaurantId}`).emit("order:new", orderData);
  });

  socket.on("order:update", (orderData) => {
    console.log("🔄 Order update event:", orderData);
    io.to(`restaurant:${orderData.restaurantId}`).emit(
      "order:update",
      orderData
    );
  });

  socket.on("order:cancelled", (orderData) => {
    console.log("❌ Order cancelled event:", orderData);
    io.to(`restaurant:${orderData.restaurantId}`).emit(
      "order:cancelled",
      orderData
    );
  });

  socket.on("kitchen:order_ready", (orderData) => {
    console.log("🍽️ Order ready event:", orderData);
    io.to(`restaurant:${orderData.restaurantId}`).emit(
      "kitchen:order_ready",
      orderData
    );
  });

  socket.on("inventory:low", (alertData) => {
    console.log("📦 Low inventory alert:", alertData);
    io.to(`restaurant:${alertData.restaurantId}`).emit(
      "inventory:low",
      alertData
    );
  });

  socket.on("notification:new", (notificationData) => {
    console.log("🔔 New notification:", notificationData);
    io.to(`restaurant:${notificationData.restaurantId}`).emit(
      "notification:new",
      notificationData
    );
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// API Routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/public/menu", require("./routes/public-menu"));
app.use("/api/restaurants", auth, require("./routes/restaurants"));
app.use("/api/onboarding", auth, require("./routes/onboarding"));
app.use("/api/menus", auth, require("./routes/menus"));
app.use("/api/orders", auth, require("./routes/orders"));
app.use("/api/customers", auth, require("./routes/customers"));
app.use("/api/inventory", auth, require("./routes/inventory"));
app.use("/api/analytics", auth, require("./routes/analytics"));
app.use("/api/deployments", auth, require("./routes/deployments"));
app.use("/api/website", require("./routes/website"));
const templatesRoutes = require("./routes/templates");

// New API Routes (will create these)
app.use("/api/staff", auth, require("./routes/staff"));
app.use("/api/templates", templatesRoutes);
app.use("/api/qr-codes", auth, require("./routes/qrCodes"));
app.use("/api/social", auth, require("./routes/social"));
app.use("/api/loyalty", auth, require("./routes/loyalty"));
app.use("/api/payments", auth, require("./routes/payments"));
app.use("/api/notifications", auth, require("./routes/notifications"));
app.use("/api/ai-phone", auth, require("./routes/aiPhone"));
app.use("/api/reports", auth, require("./routes/reports"));

// File upload middleware
app.use("/api/upload", auth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Here you would typically upload to Cloudinary or another service
    // For now, return file info
    res.json({
      success: true,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public API Routes (no auth required)
app.get("/api/public/menu/:restaurantId", async (req, res) => {
  try {
    const MenuItem = require("./models/Menu");
    const { restaurantId } = req.params;

    const menuItems = await MenuItem.find({
      restaurantId,
      isAvailable: true,
    }).select("name description price category image modifiers");

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

app.post("/api/public/orders", async (req, res) => {
  try {
    const Order = require("./models/Order");
    const Restaurant = require("./models/Restaurant");
    const Customer = require("./models/Customer");

    const { restaurantId, customer, items, orderType, tableNumber } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
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

    // Update customer data
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

    // Emit new order event
    const io = req.app.get("io");
    io.to(`restaurant:${restaurantId}`).emit("order:new", {
      restaurantId,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        items: order.items,
        customer: order.customer,
        orderType: order.orderType,
        status: order.status,
        createdAt: order.createdAt,
      },
    });

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

// Serve static websites
const WEBSITES_DIR = path.join(__dirname, "hosted-websites");
app.use("/websites", express.static(WEBSITES_DIR));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "Server is running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});
// Serve deployed React websites

app.use("/restaurant", express.static(path.join(__dirname, "../deployments")));
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 OrderChef API running on port ${PORT}`);
  console.log(`🔑 JWT Secret: ${JWT_SECRET ? "✅ Set" : "❌ Not set"}`);
  console.log(`🔗 Socket.io ready for real-time connections`);
  console.log(`📁 Websites directory: ${WEBSITES_DIR}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, server, io };
