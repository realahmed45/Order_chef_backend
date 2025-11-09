const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "recipientModel",
    },
    recipientModel: {
      type: String,
      enum: ["User", "Staff", "Customer"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "order_new",
        "order_update",
        "order_ready",
        "order_cancelled",
        "inventory_low",
        "staff_clockin",
        "staff_clockout",
        "payment_received",
        "payment_failed",
        "customer_birthday",
        "review_new",
        "system_alert",
        "marketing",
        "custom",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    channels: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "read"],
      default: "pending",
    },
    scheduledFor: Date,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    expiresAt: Date,
    actionUrl: String,
    imageUrl: String,
    retryCount: {
      type: Number,
      default: 0,
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
notificationSchema.index({ restaurantId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ type: 1, scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark as read
notificationSchema.methods.markAsRead = function () {
  this.status = "read";
  this.readAt = new Date();
  return this.save();
};

// Mark as delivered
notificationSchema.methods.markAsDelivered = function () {
  this.status = "delivered";
  this.deliveredAt = new Date();
  return this.save();
};

// Mark as sent
notificationSchema.methods.markAsSent = function () {
  this.status = "sent";
  this.sentAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Notification", notificationSchema);
