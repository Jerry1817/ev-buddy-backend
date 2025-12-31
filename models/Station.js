const Station = require("../models/Station");

exports.registerHost = async (req, res) => {
  try {
    const {
      stationName,
      email,
      phone,
      address,
      power,
      rate,
      totalChargers,
      type, // Public / Private
    } = req.body;

    // 🔒 BASIC VALIDATION
    if (!stationName || !address || !totalChargers || !power) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    // 🔑 Logged-in host id from token
    const hostId = req.user.id;

    // 🏭 CREATE STATION
    const station = await Station.create({
      name: stationName,          // 🔁 match DB field
      email,
      phone,
      address,
      power,
      rate,
      totalChargers,
      chargersAvailable: totalChargers,
      type: type || "Public",
      status: "Offline",          // default
      hostId,
    });

    return res.status(201).json({
      message: "Host station registered successfully",
      station,
    });
  } catch (error) {
    console.error("Host Register Error:", error);
    return res.status(500).json({
      message: "Host registration failed",
    });
  }
};
