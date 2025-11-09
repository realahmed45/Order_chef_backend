const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["manager", "chef", "server", "cashier", "cleaner", "delivery"],
      required: true,
    },
    department: {
      type: String,
      enum: ["kitchen", "front-of-house", "management", "delivery"],
      required: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    permissions: {
      canAccessPOS: { type: Boolean, default: false },
      canManageInventory: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canManageStaff: { type: Boolean, default: false },
      canProcessRefunds: { type: Boolean, default: false },
    },
    schedule: {
      monday: {
        start: String,
        end: String,
        isWorking: { type: Boolean, default: false },
      },
      tuesday: {
        start: String,
        end: String,
        isWorking: { type: Boolean, default: false },
      },
      wednesday: {
        start: String,
        end: String,
        isWorking: { type: Boolean, default: false },
      },
      thursday: {
        start: String,
        end: String,
        isWorking: { type: Boolean, default: false },
      },
      friday: {
        start: String,
        end: String,
        isWorking: { type: Boolean, default: false },
      },
      saturday: {
        start: String,
        end: String,
        isWorking: { type: Boolean, default: false },
      },
      sunday: {
        start: String,
        end: String,
        isWorking: { type: Boolean, default: false },
      },
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for restaurant and employee ID
staffSchema.index({ restaurantId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model("Staff", staffSchema);
