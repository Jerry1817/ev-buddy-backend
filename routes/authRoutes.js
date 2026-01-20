const express = require("express");
const {protect}=require('../middleware/authMiddleware')
const { register, login, getProfile, becomeHost, AddLocation, getMyChargingRequests, Arrivedrequest, verifyPayment, startSessioncharging, endSession, createOrder, getDashboardStats, addReview, addComplaint, Userprofile, verifyOtp, resendOtp, getHomeStats } = require("../controllers/authController");
const upload = require("../middleware/upload.Middleware");
const router = express.Router();


router.post("/register", register);
router.post("/verifyotp", verifyOtp);
router.post("/resendotp", resendOtp);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.post('/becomehost',protect,becomeHost)
router.post('/userslocation',protect,AddLocation)
router.get('/viewrequests',protect,getMyChargingRequests)
router.patch("/charging/arrived/:requestId", protect, Arrivedrequest)
router.post('/chargingstart',protect,startSessioncharging)
router.post('/chargingend',protect,endSession)
router.post('/payment/createorder',protect,createOrder)
router.post('/payment/verify',protect,verifyPayment)
router.post('/addreview',protect,addReview)
router.post('/complaint',protect,upload.array("images", 5),addComplaint)
router.get('/me',protect,Userprofile)
router.get('/homestats',protect,getHomeStats)

module.exports = router;


