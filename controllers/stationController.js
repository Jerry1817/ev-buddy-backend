const Station = require("../models/Station");

exports.getAllStations = async (req, res) => {
  try {
    const stations = await Station.find().sort({ createdAt: -1 });

    res.status(200).json(stations);
  } catch (error) {
    console.error("GET STATIONS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch stations" });
  }
};
