const express = require("express");
const router = express.Router();
const Station = require("../models/Station");

// GET all stations
router.get("/", async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
