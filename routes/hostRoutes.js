const express = require("express");
const router = express.Router();

const {protect} = require("../middleware/authMiddleware");
const { startCharging, stopCharging, getHostReviews, viewallrequests } = require("../controllers/hostController");

// Host view all charging requests
router.get('/allrequests', protect, viewallrequests);

// Host start charging (when driver has arrived)
router.patch('/start/:requestId', protect, startCharging);

// Host stop charging (when charging is complete)
router.patch('/stop/:requestId', protect, stopCharging);

router.get('/reviews', protect, getHostReviews);
module.exports = router;
