const express = require("express");
const router = express.Router();
const { 
  adminLogin, 
  getDashboardStats, 
  getAllUsers, 
  getAllHosts, 
  getAllComplaints, 
  updateComplaintStatus,
  getAllTransactions,
  blockUser,
  unblockUser
} = require("../controllers/adminController");
const { adminProtect } = require("../middleware/adminMiddleware");

// Public route - Admin Login
router.post("/login", adminLogin);

// Protected routes - Require admin token
router.get("/stats", adminProtect, getDashboardStats);
router.get("/users", adminProtect, getAllUsers);
router.get("/hosts", adminProtect, getAllHosts);
router.get("/complaints", adminProtect, getAllComplaints);
router.put("/complaints/:id", adminProtect, updateComplaintStatus);
router.get("/transactions", adminProtect, getAllTransactions);

// Block/Unblock users and hosts
router.put("/users/:id/block", adminProtect, blockUser);
router.put("/users/:id/unblock", adminProtect, unblockUser);

module.exports = router;
