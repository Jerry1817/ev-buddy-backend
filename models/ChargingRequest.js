const mongoose = require("mongoose");

const chargingRequestSchema = new mongoose.Schema(
  {
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

    status: {
      type: String,
      enum: [
        "REQUESTED", // user sent request
        "ACCEPTED", // host accepted
        "REJECTED",
        "ARRIVED", // user reached station
        "START_REQUESTED", // user clicked start
        "ACTIVE", // charging ongoing
        "COMPLETED",
        "CANCELLED",
        "EXPIRED", // auto-cancelled after 10 min no response
      ],
      default: "REQUESTED",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    arrivedAt: Date,
    acceptedAt: Date,
    startedAt: Date, // When host confirms start
    endedAt: Date, // When host stops charging
    totalDuration: Number, // optional: can be calculated
    totalCost: Number, // optional: calculated based on duration and chargingPricePerUnit
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChargingRequest", chargingRequestSchema);
