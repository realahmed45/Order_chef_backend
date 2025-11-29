const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
    },
    items: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        description: String,
        category: String,
        modifiers: [
          {
            name: String,
            price: Number,
          },
        ],
      },
    ],
    orderType: {
      type: String,
      enum: ["delivery", "takeaway", "dine-in"],
      required: true,
      default: "delivery",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash-on-delivery", "card", "online", "wallet"],
      default: "cash-on-delivery",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    estimatedReadyTime: {
      type: Date,
    },
    actualReadyTime: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    tableNumber: {
      type: String,
    },
    notes: {
      type: String,
    },
    specialInstructions: {
      type: String,
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: String,
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate order number
OrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    });
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }

  // Calculate final amount
  if (
    this.isModified("totalAmount") ||
    this.isModified("deliveryFee") ||
    this.isModified("discount") ||
    this.isModified("tax")
  ) {
    this.finalAmount =
      this.totalAmount + this.deliveryFee + this.tax - this.discount;
  }

  // Add status to history
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: "system",
    });
  }

  next();
});

// Indexes for better query performance
OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ "customer.phone": 1 });
OrderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model("Order", OrderSchema);
