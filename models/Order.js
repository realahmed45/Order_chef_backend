const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    default: 1,
  },
  modifiers: [
    {
      name: String,
      option: String,
      price: Number,
    },
  ],
  specialInstructions: String,
});

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      name: String,
      phone: String,
      email: String,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery"],
      default: "takeaway",
    },
    tableNumber: String,
    totalAmount: {
      type: Number,
      required: true,
    },
    estimatedReadyTime: Date,
    actualReadyTime: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const dateString = date.toISOString().slice(2, 10).replace(/-/g, "");
    const count = await mongoose.model("Order").countDocuments({
      restaurantId: this.restaurantId,
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      },
    });
    this.orderNumber = `ORD-${dateString}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
