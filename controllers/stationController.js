const Station = require("../models/Station");

// GET all stations
exports.getStations = async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stations" });
  }
};
