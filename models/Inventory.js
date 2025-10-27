const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
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
    category: String,
    currentStock: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    reorderPoint: {
      type: Number,
      default: 0,
    },
    costPerUnit: Number,
    supplier: String,
    lastRestocked: Date,
    autoDeduct: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inventory", inventorySchema);
