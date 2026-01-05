const express = require("express");
const router = express.Router();
const { getAllStations, getNearbyStations } = require("../controllers/stationController");

router.get("/nearbystations", getNearbyStations);

module.exports = router;
