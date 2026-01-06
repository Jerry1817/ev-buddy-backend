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
      ref: "users",
      required: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    startTime: Date,
    endTime: Date,
    durationInMinutes: Number,
    totalCost: Number,
    
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },

    status: {
      type: String,
      enum: ["STARTED", "COMPLETED"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChargingSession", chargingSessionSchema);
