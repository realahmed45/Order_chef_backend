const mongoose = require("mongoose");

const modifierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  options: [
    {
      name: String,
      priceAdjustment: {
        type: Number,
        default: 0,
      },
    },
  ],
});

const menuItemSchema = new mongoose.Schema(
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
    description: String,
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: String,
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      default: 15,
    },
    modifiers: [modifierSchema],
    ingredients: [
      {
        name: String,
        quantity: Number,
        unit: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
