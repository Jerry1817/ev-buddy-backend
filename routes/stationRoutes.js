const express = require("express");
const router = express.Router();
const { getAllStations, getNearbyStations } = require("../controllers/stationController");
const {protect}=require('../middleware/authMiddleware')

router.get("/nearbystations",protect, getNearbyStations);

module.exports = router;
