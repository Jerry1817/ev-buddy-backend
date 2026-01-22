const express = require("express");
const {protect}=require('../middleware/authMiddleware')
const { register, login, getProfile, becomeHost, AddLocation, getMyChargingRequests, Arrivedrequest, verifyPayment, startSessioncharging, endSession, createOrder, addReview, addComplaint, getHomeStats, uploadProfileImage, verifyOtp, resendOtp, Userprofile, getTransactionHistory } = require("../controllers/authController");
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
router.post('/payment/verify',protect,verifyPayment)
router.post('/payment/createorder',protect,createOrder)
router.post('/addreview',protect,addReview)
router.post('/complaint',protect,upload.array("images", 5),addComplaint)
router.get('/me',protect,Userprofile)
// Initial home data (banner, stats)
router.get("/homestats", protect, getHomeStats);

// Profile Upload
router.post("/upload-avatar", protect, upload.single("image"), uploadProfileImage);

// Transaction History
router.get("/transactions", protect, getTransactionHistory);

module.exports = router;
