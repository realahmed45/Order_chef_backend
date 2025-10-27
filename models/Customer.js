const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: String,
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    lastOrderDate: Date,
    favoriteItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
      },
    ],
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Customer", customerSchema);
