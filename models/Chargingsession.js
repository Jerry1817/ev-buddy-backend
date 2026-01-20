const mongoose = require("mongoose");

const chargingSessionSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChargingRequest",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startTime: {
      type: Date,
    },

    endTime: {
      type: Date,
    },

    durationInMinutes: Number,

    energyConsumed: {
      type: Number, // kWh
    },

    pricePerUnit: Number,

    totalCost: Number,

    startedBy: {
      type: String,
      enum: ["USER", "HOST"],
      default: "HOST",
    },

    stoppedBy: {
      type: String,
      enum: ["HOST", "SYSTEM"],
    },

    status: {
      type: String,
      enum: [
        "CREATED",    // session created, not started
        "CHARGING",   // electricity flowing
        "STOP_REQUESTED",
        "COMPLETED",
      ],
      default: "CREATED",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ChargingSession || mongoose.model("ChargingSession", chargingSessionSchema);

