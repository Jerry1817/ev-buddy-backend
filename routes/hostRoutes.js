const express = require("express");
const router = express.Router();

const {protect} = require("../middleware/authMiddleware");
const {viewallrequests, startCharging, stopCharging } = require("../controllers/hostController");

// Host view all charging requests
router.get('/allrequests', protect, viewallrequests);

// Host start charging (when driver has arrived)
router.patch('/start/:requestId', protect, startCharging);

// Host stop charging (when charging is complete)
router.patch('/stop/:requestId', protect, stopCharging);

module.exports = router;
