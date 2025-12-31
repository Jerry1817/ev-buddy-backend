const Station = require("../models/Station");

exports.registerHost = async (req, res) => {
  try {
    if (req.user.role !== "host") {
      return res.status(403).json({ message: "Not a host" });
    }

    const {
      stationName,
      phone,
      address,
      power,
      rate,
      totalChargers,
    } = req.body;

    if (!stationName || !totalChargers) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const station = await Station.create({
      name: stationName,
      phone,
      address,
      power,
      rate,
      totalChargers,
      chargersAvailable: totalChargers,
      hostId: req.user.id,
    });

    res.status(201).json({ message: "Station registered", station });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Host registration failed" });
  }
};
