const express = require("express");
const {protect}=require('../middleware/authMiddleware')
const { register, login, getProfile, becomeHost, AddLocation, getMyChargingRequests, verifyPayment, startSessioncharging, endSession, createOrder, getDashboardStats, addReview, addComplaint, Userprofile } = require("../controllers/authController");
const upload = require("../middleware/upload.Middleware");
const router = express.Router();

// router.get("/homestats", protect, getDashboardStats);
router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.post('/becomehost',protect,becomeHost)
router.post('/userslocation',protect,AddLocation)
router.get('/viewrequests',protect,getMyChargingRequests)
router.post('/chargingstart',protect,startSessioncharging)
router.post('/chargingend',protect,endSession)
router.post('/payment/createorder',protect,createOrder)
router.post('/addreview',protect,addReview)
router.post('/complaint',protect,upload.array("images", 5),addComplaint)
router.get('/me',protect,Userprofile)

module.exports = router;
