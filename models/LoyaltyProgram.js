const mongoose = require("mongoose");

const loyaltyProgramSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: "Loyalty Program",
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    pointsSettings: {
      earningRate: {
        type: Number,
        default: 1, // 1 point per $1 spent
      },
      minimumSpend: {
        type: Number,
        default: 0,
      },
      bonusMultiplier: {
        type: Number,
        default: 1,
      },
      expirationDays: {
        type: Number,
        default: 365, // Points expire after 1 year
      },
    },
    tiers: [
      {
        name: { type: String, required: true },
        minimumPoints: { type: Number, required: true },
        benefits: {
          pointsMultiplier: { type: Number, default: 1 },
          discountPercentage: { type: Number, default: 0 },
          freeDelivery: { type: Boolean, default: false },
          prioritySupport: { type: Boolean, default: false },
          exclusiveOffers: { type: Boolean, default: false },
        },
        color: { type: String, default: "#F97316" },
        icon: String,
      },
    ],
    rewards: [
      {
        name: { type: String, required: true },
        description: String,
        pointsCost: { type: Number, required: true },
        rewardType: {
          type: String,
          enum: ["discount", "freeItem", "cashback", "custom"],
          required: true,
        },
        value: Number, // Discount amount, item price, etc.
        conditions: {
          minimumOrder: Number,
          validDays: [String], // ["monday", "tuesday", ...]
          validTimes: {
            start: String,
            end: String,
          },
          maxUsesPerCustomer: Number,
          validUntil: Date,
        },
        isActive: { type: Boolean, default: true },
        usageCount: { type: Number, default: 0 },
      },
    ],
    campaigns: [
      {
        name: { type: String, required: true },
        description: String,
        type: {
          type: String,
          enum: ["signup", "referral", "birthday", "anniversary", "seasonal"],
          required: true,
        },
        bonusPoints: Number,
        isActive: { type: Boolean, default: true },
        startDate: Date,
        endDate: Date,
        conditions: {
          newCustomersOnly: { type: Boolean, default: false },
          minimumSpend: Number,
          maxParticipants: Number,
        },
        participantCount: { type: Number, default: 0 },
      },
    ],
    analytics: {
      totalMembers: { type: Number, default: 0 },
      activeMembers: { type: Number, default: 0 },
      pointsIssued: { type: Number, default: 0 },
      pointsRedeemed: { type: Number, default: 0 },
      rewardsRedeemed: { type: Number, default: 0 },
      averagePointsPerMember: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 }, // % of customers who join
    },
  },
  {
    timestamps: true,
  }
);

// Default tiers
loyaltyProgramSchema.pre("save", function (next) {
  if (this.isNew && this.tiers.length === 0) {
    this.tiers = [
      {
        name: "Bronze",
        minimumPoints: 0,
        benefits: {
          pointsMultiplier: 1,
          discountPercentage: 0,
        },
        color: "#CD7F32",
      },
      {
        name: "Silver",
        minimumPoints: 500,
        benefits: {
          pointsMultiplier: 1.25,
          discountPercentage: 5,
          freeDelivery: true,
        },
        color: "#C0C0C0",
      },
      {
        name: "Gold",
        minimumPoints: 1500,
        benefits: {
          pointsMultiplier: 1.5,
          discountPercentage: 10,
          freeDelivery: true,
          prioritySupport: true,
        },
        color: "#FFD700",
      },
      {
        name: "Platinum",
        minimumPoints: 3000,
        benefits: {
          pointsMultiplier: 2,
          discountPercentage: 15,
          freeDelivery: true,
          prioritySupport: true,
          exclusiveOffers: true,
        },
        color: "#E5E4E2",
      },
    ];
  }
  next();
});

module.exports = mongoose.model("LoyaltyProgram", loyaltyProgramSchema);
