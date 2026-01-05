const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  sendRequest,
  getHostRequests,
  acceptRequest,
  rejectRequest,
  getUserRequests
} = require("../controllers/chargingRequestController");

// USER
// router.post("/send", authMiddleware, sendRequest);

// // HOST
// router.get("/host", authMiddleware, getHostRequests);
// router.put("/accept/:requestId", authMiddleware, acceptRequest);
// router.put("/reject/:requestId", authMiddleware, rejectRequest);

module.exports = router;
