const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { registerStation } = require("../controllers/hostController");

// 🔥 THIS MUST BE A FUNCTION
router.post("/register", authMiddleware, registerStation);

module.exports = router;
