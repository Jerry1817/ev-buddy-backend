const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ChargingRequest = require("../models/ChargingRequest");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
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
    const { email, password ,phone} = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
      user.phone=phone
      await user.save()
      
  res.json({
  success: true,
  token: generateToken(user._id),
  role: user.roles.includes("HOST") ? "HOST" : "DRIVER",
  message:"user logged in successfully",
  data: {
    id: user._id,
    name: user.name,
    email: user.email,
    phone:user.phone
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
  const { stationName, address, availableChargers,chargingPricePerUnit, longitude,latitude } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.roles = "HOST";
    user.isHostActive = true;
    user.evStation = { name: stationName, address, availableChargers,chargingPricePerUnit };
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

// userside
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
    const { sessionId } = req.body;
    console.log(sessionId,);

  const user = await User.findById(req.user.id);
    
    const session = await ChargingSession.findById(sessionId);
    if (!session || session.status !== "COMPLETED") {
      return res.status(400).json({ message: "Invalid session" });
    }

    const hostid=session.host

    const host=await User.findById({_id:hostid})

    
    const order = await razorpay.orders.create({
      amount: session.totalCost * 100, // paise
      currency: "INR",
      receipt: `session_${session._id}`,
    });
    
    session.paymentStatus="PAID"
    await session.save()

    res.status(200).json({
      success: true,
      order,
      session,
      host,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getDashboardStats = async (req, res) => {
  try {
    // 1️⃣ Total active charging stations
    console.log(req.user.id,"req.user.id");
    
      const usercharged = await ChargingRequest.countDocuments(
        {driver:req.user.id,
          status:"accepted"},{$sum:1}
      );

    const totalStations = await User.countDocuments({
      roles: "HOST",
      isHostActive: true,
    });

    // 2️⃣ Connector type count
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
        usercharged,
        totalStations,
        connectorTypeCount,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};