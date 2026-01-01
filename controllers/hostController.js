const Station = require("../models/Station");

/**
 * HOST → REGISTER STATION
 */
const registerStation = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "host") {
      return res.status(403).json({ message: "Only hosts can register stations" });
    }

    const {
      stationName,
      totalChargers,
      power,
      rate,
      address,
      location,
    } = req.body;

    if (
      !stationName ||
      !totalChargers ||
      !power ||
      !rate ||
      !address ||
      !location ||
      location.lat === undefined ||
      location.lng === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const station = await Station.create({
      stationName,
      totalChargers,
      chargersAvailable: totalChargers,
      power,
      rate,
      address,
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
      },
      host: req.user._id,
    });

    console.log("✅ Station saved:", station._id);

    res.status(201).json({
      message: "Station registered successfully",
      station,
    });
  } catch (error) {
    console.error("❌ Station register error:", error);
    res.status(500).json({ message: "Station registration failed" });
  }
};

module.exports = {
  registerStation,
};
