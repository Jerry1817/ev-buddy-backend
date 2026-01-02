const express = require("express");
const {protect}=require('../middleware/authMiddleware')
const { register, login, getProfile, becomeHost } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.post('/becomehost',protect,becomeHost)

module.exports = router;
