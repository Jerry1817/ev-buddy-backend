const express = require("express");
const router = express.Router();

const { registerHost } = require("../controllers/hostController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authMiddleware, registerHost);

module.exports = router;
