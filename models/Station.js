const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema(
  {
    stationName: {
      type: String,
      required: true,
    },
    totalChargers: {
      type: Number,
      required: true,
    },
    chargersAvailable: {
      type: Number,
      default: 0,
    },
    power: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Station", stationSchema);
