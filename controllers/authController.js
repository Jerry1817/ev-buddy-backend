const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ChargingRequest = require("../models/ChargingRequest");
const razorpay = require("../config/razorpay");
const ChargingSession = require("../models/ChargingSession");
const Review = require("../models/Review");
const Complaint = require("../models/Complaint");
const sendOtpEmail = require("../config/email");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, roles, evModel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email or phone",
      });
    }

    const userData = {
      name,
      email,
      password,
      phone,
      roles: roles || "DRIVER",
      evModel,
    };

    const user = await User.create(userData);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOtpEmail(user.email, otp);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        evModel: user.evModel,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp, "otpp");

    const user = await User.findOne({ otp });
    console.log(user, "userddddddd");

    if (!user || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified",
      });
    }

    await sendOtpEmail(user.email, otp);

    const otp = crypto.randomInt(100000, 999999).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};

/* =========================
   LOGIN (User / Host)
========================= */
exports.login = async (req, res, next) => {
  try {
    const { email, password, phone } = req.body;
    console.log(req.body,"ll");
    
    const user = await User.findOne({ email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is blocked by admin
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your account has been blocked by admin. Please contact support.",
      });
    }

    // if (!user.isVerified) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Please verify your email before logging in",
    //   });
    // }

    if (user.roles === "HOST" && !user.isHostActive) {
      return res.status(403).json({
        success: false,
        message: "Host account is not activated yet",
      });
    }

    if (phone && phone !== user.phone) {
      user.phone = phone;
      await user.save();
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      role: user.roles.includes("HOST") ? "HOST" : "DRIVER",
      message: "user logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        evStation: user.evStation || null,
        evModel: user.evModel || null,
        averageRating: user.averageRating || 0,
        reviewCount: user.reviewCount || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res) => {
  console.log(req.user.id, "oo");
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.roles,
      isHost: user.isHost,
      evStation: user.evStation,
    },
  });
};

exports.becomeHost = async (req, res) => {
  try {
    const {
      stationName,
      address,
      availableChargers,
      chargingPricePerUnit,
      power,
      connectorType,
      description,
      latitude,
      longitude,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate numbers
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    user.roles = "HOST";
    user.isHostActive = true;

    user.evStation = {
      name: stationName,
      address,
      availableChargers: Number(availableChargers) || 1,
      chargingPricePerUnit: Number(chargingPricePerUnit) || 0,
      power: Number(power) || 0,
      connectorType: connectorType || "Type 2",
      description: description || "",
    };

    // 🔥 STORE STATION LOCATION CORRECTLY
   user.location = {
      type: "Point",
      coordinates: [lng, lat], // IMPORTANT ORDER
    };

    await user.save();

    res.json({
      success: true,
      message: "Host registered successfully",
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.AddLocation = async (req, res) => {
  try {
    let { latitude, longitude } = req.body;

    latitude = Number(latitude);
    longitude = Number(longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude must be numbers",
      });
    }

    if (
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude range",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Always update user movement location
    user.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    // 🔥 IMPORTANT: Do NOT auto-update station location
    // Only set it when user becomes host
    if (user.roles !== "HOST") {
      // fine — just user movement
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: user.location,
    });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const AUTO_CANCEL_MINUTES = 10;

const isExpired = (createdAt) => {
  const now = new Date();
  const diff = (now - createdAt) / (1000 * 60);
  return diff > AUTO_CANCEL_MINUTES;
};

// userside
exports.getMyChargingRequests = async (req, res) => {
  try {
    // 1️⃣ Fetch user requests (latest first)
    const requests = await ChargingRequest.find({
      driver: req.user.id,
    })
      .populate("host", "name evStation")
      .sort({ createdAt: -1 });

    // 2️⃣ Auto-reject expired pending requests
    for (const reqItem of requests) {
      if (reqItem.status === "pending" && isExpired(reqItem.createdAt)) {
        reqItem.status = "rejected";
        await reqItem.save();
      }
    }

    // 3️⃣ Get charging sessions for these requests
    const requestIds = requests.map((r) => r._id);

    const sessions = await ChargingSession.find({
      request: { $in: requestIds },
      driver: req.user.id,
    });

    // 4️⃣ Map sessions by request ID
    const sessionMap = {};
    sessions.forEach((session) => {
      sessionMap[session.request.toString()] = session;
    });

    // 5️⃣ Merge session info into requests
    const formattedRequests = requests.map((reqItem) => {
      const session = sessionMap[reqItem._id.toString()];

      return {
        ...reqItem.toObject(),
        chargingStatus: session?.status || null,
        paymentStatus: session?.paymentStatus || null,
      };
    });

    res.json({
      success: true,
      data: formattedRequests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * DRIVER → Mark as Arrived at charging station
 * Updates request status from ACCEPTED to ARRIVED
 */
exports.Arrivedrequest = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { requestId } = req.params;

    // Find the request belonging to this driver
    const request = await ChargingRequest.findOne({
      _id: requestId,
      driver: driverId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Charging request not found",
      });
    }

    // Validate current status is ACCEPTED
    if (request.status !== "ACCEPTED") {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as arrived. Current status is ${request.status}. Request must be accepted first.`,
      });
    }

    // Update status to ARRIVED
    request.status = "ARRIVED";
    request.arrivedAt = new Date();
    await request.save();

    console.log("✅ Driver arrived at station:", request._id);

    res.status(200).json({
      success: true,
      message: "Arrival confirmed! Please connect your charger and wait for host to start charging.",
      data: request,
    });
  } catch (error) {
    console.error("❌ Arrived request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark arrival",
    });
  }
};





exports.startSessioncharging = async (req, res) => {
  try {
    //     if (req.user.id.toString() !== request.host.toString()) {
    //   return res.status(403).json({ message: "Only host can start session" });
    // }

    const { requestId } = req.body;

    const request = await ChargingRequest.findById(requestId);
    if (!request || request.status !== "accepted") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const session = await ChargingSession.create({
      request: request._id,
      driver: request.driver,
      host: request.host,
      startTime: new Date(),
      status: "STARTED",
    });

    res.json({
      success: true,
      message: "Charging session started",
      data: session,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await ChargingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "STARTED") {
      return res.status(400).json({ message: "Session already completed" });
    }

    session.endTime = new Date();

    // Duration in minutes
    const durationMs = session.endTime - session.startTime;
    const durationInMinutes = Math.ceil(durationMs / (1000 * 60));

    const host = await User.findById(session.host);

    const pricePerMinute = host.chargingPricePerUnit || 5;
    const totalCost = durationInMinutes * pricePerMinute;

    session.durationInMinutes = durationInMinutes;
    session.totalCost = totalCost;
    session.status = "COMPLETED";

    await session.save();

    res.status(200).json({
      success: true,
      message: "Charging session ended",
      data: {
        sessionId: session._id,
        durationInMinutes,
        totalCost,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { requestId } = req.body;
    console.log(requestId,"requestId");

    const user = await User.findById(req.user.id);

    const session = await ChargingSession.findOne({ request: requestId });
    
    if (!session || session.status !== "COMPLETED") {
      return res.status(400).json({ message: "Invalid session" });
    }

    const hostid = session.host;

    const host = await User.findById(hostid);

    const order = await razorpay.orders.create({
      amount: session.totalCost * 100, // paise
      currency: "INR",
      receipt: `session_${session._id}`,
    });

    // Do NOT update status here (wait for verification)
    // session.paymentStatus = "PAID";
    // await session.save();

    res.status(200).json({
      success: true,
      order,
      session,
      host,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment Verified - Update Database
      const orderId = razorpay_order_id;
      
      // Find session by parsing the receipt from order (need to store Razorpay order ID in session preferably, 
      // but for now we trust the flow or query by order ID if stored. 
      // Better approach: When createOrder happens, user sends requestId here too or we lookup order)
      
      // Since we don't have direct link in this request body easily without frontend passing it, 
      // let's rely on finding any incomplete session for this user or better yet, passed requestId.
      // BUT, easier way: The frontend must pass `responseData` which contains signature.
      // We also need the Session ID to update.
      
      // Let's assume frontend passes the requestId or we can find it via Order Receipt if we fetch order from Razorpay.
      // Easiest is to ask frontend to pass requestId or sessionId along with verification data.
      
      // Looking at `createOrder` above, it creates receipt: `session_${session._id}`
      // We can fetch the order from Razorpay to get receipt, OR frontend passes sessionId.
      
      // Let's update frontend to pass sessionId/requestId. 
      // For now, let's extract session ID from the order if possible, or just request it.
      
      // Wait, let's fetch the order from Razorpay to be safe? No, that adds latency.
      // Let's expect `requestId` in body for simplicity, or we update `createOrder` to save orderId in session.
      
      // PLAN: Update `createOrder` to save `razorpayOrderId` in session.
      // Then here we find session by `razorpayOrderId`.
      
      // Let's update `createOrder` first properly (I will do this in next step if needed, or do it now via verifyPayment logic)
      
      // Actually, simplest fix without changing DB schema too much:
      // Frontend sends `order_id`. We can query Razorpay or just trust the signature.
      // If signature is valid, we need to know WHICH session to update.
      // We will REQUIRE `requestId` or `sessionId` in the verify body.
      
      const { requestId } = req.body;
      const session = await ChargingSession.findOne({ request: requestId });
      
      if (!session) return res.status(404).json({ message: "Session not found" });

      session.paymentStatus = "PAID";
      await session.save();

      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.addReview = async (req, res) => {
  try {
    console.log("hjdhhdsjushd");

    const { requestId, stationId, rating, review, tags } = req.body;
    console.log(req.body, "ooooooooooooooo");

    const driverId = req.user.id;

    // 1️ Validate request
    const chargingRequest = await ChargingRequest.findById(requestId);
    if (!chargingRequest) {
      return res.status(404).json({ message: "Charging request not found" });
    }

    if (chargingRequest.driver.toString() !== driverId) {
      return res.status(403).json({ message: "Unauthorized review attempt" });
    }
    // 2️ Check charging session (must be PAID)
    const session = await ChargingSession.findOne({
      request: requestId,
      driver: driverId,
      paymentStatus: "PAID",
      status: "COMPLETED",
    });

    if (!session) {
      return res.status(400).json({
        message: "Review allowed only after completed & paid charging session",
      });
    }

    // 3️ Prevent duplicate reviews
    const existingReview = await Review.findOne({ request: requestId });
    if (existingReview) {
      return res.status(409).json({
        message: "You have already reviewed this charging session",
      });
    }

    // 4️ Create review
    const newReview = await Review.create({
      request: requestId,
      station: stationId,
      driver: driverId,
      host: chargingRequest.host,
      rating,
      review,
      tags,
    });

    // 5️ Update host average rating
    const host = await User.findById(chargingRequest.host);

    host.reviewCount = (host.reviewCount || 0) + 1;
    host.averageRating =
      ((host.averageRating || 0) * (host.reviewCount - 1) + rating) /
      host.reviewCount;

    await host.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: newReview,
    });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addComplaint = async (req, res) => {
  try {
    const { category, subject, description, priority } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const imagePaths = req.files ? req.files.map((file) => file.path) : [];

    const complaint = await Complaint.create({
      user: req.user.id,
      category,
      subject,
      description,
      priority,
      images: imagePaths,
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Add complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.Userprofile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};


// Get home page stats for logged in user
exports.getHomeStats = async (req, res) => {
  try {
    // 1️ Total active charging stations
    const totalStations = await User.countDocuments({
      roles: "HOST",
      isHostActive: true,
    });

    // 2️ User's charging count (completed sessions)
    const usercharged = await ChargingRequest.countDocuments({
      driver: req.user.id,
      status: "COMPLETED"
    });

    // 3️ Active charging sessions for this user
    const activeChargingSessions = await ChargingRequest.countDocuments({
      driver: req.user.id,
      status: "ACTIVE"
    });

    // 4️ Connector type count (optional)
    const connectorTypeCount = await User.aggregate([
      {
        $match: {
          roles: "HOST",
          isHostActive: true,
          "evStation.connectorType": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$evStation.connectorType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          connectorType: "$_id",
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStations,
        usercharged,
        activeChargingSessions,
        connectorTypeCount,
      },
    });
  } catch (error) {
    console.error("Home stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPLOAD PROFILE IMAGE
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Save relative path
    const imagePath = `/uploads/${req.file.filename}`;
    user.profileImage = imagePath;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      profileImage: imagePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
};

/**
 * GET TRANSACTION HISTORY
 * Returns all paid charging sessions for the logged-in user
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await ChargingSession.find({
      driver: userId,
      paymentStatus: "PAID",
      status: "COMPLETED",
    })
      .populate("host", "name evStation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Get transaction history error:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};
