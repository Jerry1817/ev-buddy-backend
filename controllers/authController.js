const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ChargingRequest = require("../models/ChargingRequest");
const crypto = require("crypto");
const ChargingSession = require("../models/ChargingSession");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res, next) => {

  try {
    const user = await User.create(req.body);    
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      data: user,
    });
  } catch (err) {
    next(err);
  }
};


/* =========================
   LOGIN (User / Host)
========================= */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

  res.json({
  success: true,
  token: generateToken(user._id),
  role: user.roles.includes("HOST") ? "HOST" : "DRIVER",
  data: {
    id: user._id,
    name: user.name,
    email: user.email
  }
});

  } catch (err) {
    next(err);
  }
};


exports.getProfile = async (req, res) => {
  console.log(req.user.id,"oo");
  const user = await User.findById(req.user.id);
  
  if (!user) return res.status(404).json({ message: "User not found" });

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
  const { stationName, address, availableChargers, longitude,latitude } = req.body;
  console.log(latitude,"ll");
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.roles = "HOST";
    user.isHostActive = true;
    user.evStation = { name: stationName, address, availableChargers };
      user.location = {
      type: "Point",
      coordinates: [
        Number(latitude),
        Number(longitude),
      ],
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
}


exports.AddLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.location = {
      type: "Point",
      coordinates: [longitude, latitude], 
    };

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


exports.getMyChargingRequests = async (req, res) => {
  try {
    const requests = await ChargingRequest.find({
      driver: req.user.id,
    }).populate("host", "name evStation");

    for (let reqItem of requests) {
      if (
        reqItem.status === "pending" &&
        isExpired(reqItem.createdAt)
      ) {
        reqItem.status = "rejected";
        await reqItem.save();
      }
    }

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sessionId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const session = await ChargingSession.findById(sessionId);
    session.paymentStatus = "PAID";
    await session.save();

    res.json({
      success: true,
      message: "Payment successful",
      data: session,
    });
  } catch (err) {
    res.status(500).json({ message: "Payment verification failed" });
  }
};