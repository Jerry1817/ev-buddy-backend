const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  sendRequest,
  getHostRequests,
} = require("../controllers/chargingRequestController");

// USER → send request
router.post("/send", auth, sendRequest);

// HOST → view requests
router.get("/host", auth, getHostRequests);

module.exports = router;
