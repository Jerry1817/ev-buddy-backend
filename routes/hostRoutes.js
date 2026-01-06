const express = require("express");
const router = express.Router();

const {protect} = require("../middleware/authMiddleware");
const {viewallrequests, startSessioncharging, endSession } = require("../controllers/hostController");

// 🔥 THIS MUST BE A FUNCTION
// router.post("/register", authMiddleware, registerStation);
router.get('/allrequests',protect,viewallrequests)
router.post('/chargingstart',protect,startSessioncharging)
router.patch('/chargingend',protect,endSession)

// router.patch('')
module.exports = router;
