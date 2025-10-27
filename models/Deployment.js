const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    netlifySiteId: String,
    vercelDeploymentId: String,
    vercelUrl: String,
    websiteUrl: String,
    status: {
      type: String,
      enum: ["queued", "building", "ready", "failed", "generated"],
      default: "queued",
    },
    buildLogs: [
      {
        type: String, // FIXED: Ensure this is an array of strings
      },
    ],
    lastDeployedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deployment", deploymentSchema);
