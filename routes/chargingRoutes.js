const express = require("express");
const router = express.Router();

const {protect} = require("../middleware/authMiddleware");
const { sendRequest } = require("../controllers/chargingRequestController");

// USER → send request
router.post("/send", protect,sendRequest);

// HOST → view requests
// router.get("/host", auth, getHostRequests);

module.exports = router;
