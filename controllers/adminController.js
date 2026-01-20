const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const ChargingSession = require("../models/Chargingsession");
const ChargingRequest = require("../models/ChargingRequest");


const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "123";


exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: "admin_root", role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      role: "ADMIN",
      message: "Admin logged in successfully",
      user: {
        name: "System Admin",
        email: ADMIN_EMAIL,
        role: "ADMIN",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during admin login",
    });
  }
};


exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ roles: "DRIVER" });
    const totalHosts = await User.countDocuments({ roles: "HOST" });
    const openComplaints = await Complaint.countDocuments({ 
      status: { $in: ["OPEN", "IN_PROGRESS"] } 
    });
    
    // Calculate total revenue from completed sessions
    const revenueResult = await ChargingSession.aggregate([
      { $match: { paymentStatus: "PAID" } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalHosts,
        openComplaints,
        totalRevenue: totalRevenue || 0,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ roles: "DRIVER" })
      .select("name email phone isVerified isBlocked createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};


exports.getAllHosts = async (req, res) => {
  try {
    const hosts = await User.find({ roles: "HOST" })
      .select("name email phone isHostActive isBlocked averageRating evStation createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hosts.length,
      hosts,
    });
  } catch (error) {
    console.error("Get all hosts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hosts",
    });
  }
};


exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get all complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};


exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Complaint status updated",
      complaint,
    });
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update complaint",
    });
  }
};


exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await ChargingSession.find()
      .populate("driver", "name email")
      .populate("host", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get all transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};


exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    ).select("name email roles isBlocked");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `${user.name} has been blocked`,
      user,
    });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to block user",
    });
  }
};


exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true }
    ).select("name email roles isBlocked");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `${user.name} has been unblocked`,
      user,
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unblock user",
    });
  }
};


/**
 * GET ANALYTICS
 * Returns platform analytics: stats, usage trends, popular stations
 */
exports.getAnalytics = async (req, res) => {
  try {
    // 1. Overall Stats
    const totalUsers = await User.countDocuments({ roles: "DRIVER" });
    const totalHosts = await User.countDocuments({ roles: "HOST" });
    const totalSessions = await ChargingSession.countDocuments({ status: "COMPLETED" });

    const revenueResult = await ChargingSession.aggregate([
      { $match: { paymentStatus: "PAID" } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // 2. Daily Sessions (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySessions = await ChargingSession.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: "COMPLETED" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Top 5 Popular Stations (by session count)
    const popularStations = await ChargingSession.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: "$host", sessionCount: { $sum: 1 } } },
      { $sort: { sessionCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "hostInfo",
        },
      },
      { $unwind: "$hostInfo" },
      {
        $project: {
          _id: 0,
          hostId: "$_id",
          hostName: "$hostInfo.name",
          stationName: "$hostInfo.evStation.name",
          sessionCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: { totalUsers, totalHosts, totalSessions, totalRevenue },
        dailySessions,
        popularStations,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};
