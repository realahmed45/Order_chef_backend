const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    cuisineType: {
      type: String,
      required: true,
      enum: [
        "pizza",
        "burger",
        "mexican",
        "italian",
        "chinese",
        "indian",
        "thai",
        "american",
        "cafe",
        "bakery",
        "bbq",
        "seafood",
        "vegetarian",
        "other",
      ],
    },
    contact: {
      phone: String,
      email: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
    },
    hours: {
      monday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      tuesday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      wednesday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      thursday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      friday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      saturday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      sunday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
    },
    branding: {
      primaryColor: {
        type: String,
        default: "#EA580C", // orange-600
      },
      secondaryColor: {
        type: String,
        default: "#F97316", // orange-500
      },
      logo: String,
      banner: String,
    },
    settings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      orderingEnabled: {
        type: Boolean,
        default: true,
      },
    },
    website: {
      subdomain: String,
      isPublished: {
        type: Boolean,
        default: false,
      },
      publishedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
restaurantSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
