const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    tableName: {
      type: String,
      required: true,
    },
    qrCode: {
      type: String, // Base64 encoded QR code
      required: true,
    },
    orderingUrl: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seatingCapacity: {
      type: Number,
      default: 4,
    },
    location: {
      type: String,
      enum: ["indoor", "outdoor", "patio", "bar", "private"],
      default: "indoor",
    },
    section: {
      type: String,
      default: "main",
    },
    features: {
      hasCharging: { type: Boolean, default: false },
      isAccessible: { type: Boolean, default: false },
      hasView: { type: Boolean, default: false },
      isQuiet: { type: Boolean, default: false },
    },
    analytics: {
      totalScans: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      lastScanDate: Date,
      lastOrderDate: Date,
    },
    customization: {
      logo: String, // URL or base64
      primaryColor: { type: String, default: "#F97316" },
      welcomeMessage: String,
      instructions: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for restaurant and table
qrCodeSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

// Update analytics
qrCodeSchema.methods.recordScan = function () {
  this.analytics.totalScans += 1;
  this.analytics.lastScanDate = new Date();
  return this.save();
};

qrCodeSchema.methods.recordOrder = function (orderAmount) {
  this.analytics.totalOrders += 1;
  this.analytics.totalRevenue += orderAmount;
  this.analytics.lastOrderDate = new Date();
  return this.save();
};

module.exports = mongoose.model("QRCode", qrCodeSchema);
