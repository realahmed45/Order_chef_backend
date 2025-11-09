const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    paymentIntentId: String, // Stripe payment intent ID
    transactionId: String,
    method: {
      type: String,
      enum: ["card", "cash", "bank_transfer", "digital_wallet", "crypto"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal", "square", "manual", "razorpay"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    tax: {
      type: Number,
      default: 0,
    },
    tip: {
      type: Number,
      default: 0,
    },
    fees: {
      processingFee: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
    },
    paymentDetails: {
      cardLast4: String,
      cardBrand: String,
      billingAddress: {
        name: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        postal_code: String,
        country: String,
      },
    },
    refunds: [
      {
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        refundId: String, // Provider refund ID
        status: {
          type: String,
          enum: ["pending", "succeeded", "failed"],
          default: "pending",
        },
        processedAt: Date,
        processedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Staff",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    failureReason: String,
    receiptUrl: String,
    receiptNumber: String,
    processedAt: Date,
    webhookEventId: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ restaurantId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

// Calculate total refunded amount
paymentSchema.virtual("totalRefunded").get(function () {
  return this.refunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((total, refund) => total + refund.amount, 0);
});

// Check if payment can be refunded
paymentSchema.methods.canRefund = function (amount = null) {
  if (this.status !== "succeeded") return false;

  const refundedAmount = this.totalRefunded;
  const maxRefundable = this.amount - refundedAmount;

  if (amount === null) return maxRefundable > 0;
  return amount <= maxRefundable;
};

// Generate receipt number
paymentSchema.pre("save", function (next) {
  if (this.isNew && !this.receiptNumber) {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    this.receiptNumber = `RC${timestamp}${Math.random()
      .toString(36)
      .substr(2, 3)
      .toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
