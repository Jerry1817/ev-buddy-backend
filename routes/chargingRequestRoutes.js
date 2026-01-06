const express = require("express");
const router = express.Router();

const {
  acceptRequest,
  rejectRequest,
} = require("../controllers/chargingRequestController");
const { protect } = require("../middleware/authMiddleware");

// USER
// router.post("/send", authMiddleware, sendRequest);

// // HOST
// router.get("/host", authMiddleware, getHostRequests);
router.patch("/accept/:requestId", protect, acceptRequest);
router.patch("/reject/:requestId", protect, rejectRequest);

module.exports = router;
