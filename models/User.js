const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "staff"],
      default: "owner",
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    subscription: {
      plan: {
        type: String,
        enum: ["trial", "starter", "pro", "enterprise"],
        default: "trial",
      },
      status: {
        type: String,
        enum: ["active", "canceled", "expired"],
        default: "active",
      },
    },
    onboarding: {
      completed: {
        type: Boolean,
        default: false,
      },
      currentStep: {
        type: Number,
        default: 1,
      },
      restaurantCreated: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isTrialActive = function () {
  return new Date() < this.trialEndsAt;
};

// FIXED: Changed 'User' to 'userSchema'
module.exports = mongoose.model("User", userSchema);
