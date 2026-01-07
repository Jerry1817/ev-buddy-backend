const express = require("express");
const {protect}=require('../middleware/authMiddleware')
const { register, login, getProfile, becomeHost, AddLocation, getMyChargingRequests, verifyPayment, startSessioncharging, endSession, createOrder } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.post('/becomehost',protect,becomeHost)
router.post('/userslocation',protect,AddLocation)
router.get('/viewrequests',protect,getMyChargingRequests)
router.post('/chargingstart',protect,startSessioncharging)
router.post('/chargingend',protect,endSession)

router.post('/payment/createorder',protect,createOrder)

module.exports = router;
