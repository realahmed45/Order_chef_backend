const mongoose = require("mongoose");

const timesheetSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    clockIn: {
      time: { type: Date, required: true },
      location: {
        latitude: Number,
        longitude: Number,
      },
      photo: String, // Base64 or URL
      method: {
        type: String,
        enum: ["manual", "mobile", "biometric"],
        default: "mobile",
      },
    },
    clockOut: {
      time: Date,
      location: {
        latitude: Number,
        longitude: Number,
      },
      photo: String,
      method: {
        type: String,
        enum: ["manual", "mobile", "biometric"],
        default: "mobile",
      },
    },
    breaks: [
      {
        start: { type: Date, required: true },
        end: Date,
        type: {
          type: String,
          enum: ["lunch", "break", "personal"],
          default: "break",
        },
        duration: Number, // in minutes
      },
    ],
    totalHours: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    regularHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
    notes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    approvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Calculate hours before saving
timesheetSchema.pre("save", function (next) {
  if (this.clockIn?.time && this.clockOut?.time) {
    const totalMs = this.clockOut.time - this.clockIn.time;
    const breakMs = this.breaks.reduce((total, breakItem) => {
      if (breakItem.start && breakItem.end) {
        return total + (breakItem.end - breakItem.start);
      }
      return total;
    }, 0);

    const workMs = totalMs - breakMs;
    this.totalHours = workMs / (1000 * 60 * 60); // Convert to hours

    // Calculate overtime (assuming 8 hours is regular)
    this.regularHours = Math.min(this.totalHours, 8);
    this.overtimeHours = Math.max(this.totalHours - 8, 0);
  }
  next();
});

module.exports = mongoose.model("Timesheet", timesheetSchema);
