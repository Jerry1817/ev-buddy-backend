const Station = require("../models/Station");
const ChargingRequest = require("../models/ChargingRequest");
const Razorpay = require("razorpay");
const Chargingsession = require("../models/ChargingSession");



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
/**
 * HOST → REGISTER STATION
 */
const registerStation = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "host") {
      return res.status(403).json({ message: "Only hosts can register stations" });
    }

    const {
      stationName,
      totalChargers,
      power,
      rate,
      address,
      location,
    } = req.body;

    if (
      !stationName ||
      !totalChargers ||
      !power ||
      !rate ||
      !address ||
      !location ||
      location.lat === undefined ||
      location.lng === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const station = await Station.create({
      stationName,
      totalChargers,
      chargersAvailable: totalChargers,
      power,
      rate,
      address,
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
      },
      host: req.user._id,
    });

    console.log("✅ Station saved:", station._id);

    res.status(201).json({
      message: "Station registered successfully",
      station,
    });
  } catch (error) {
    console.error("❌ Station register error:", error);
    res.status(500).json({ message: "Station registration failed" });
  }
};


// host view
exports.viewallrequests = async (req, res) => {
  try {
    const hostId = req.user.id;
    console.log(hostId,"695cb3a7a2049d10fee89c4c");
    

    const requests = await ChargingRequest.find({
      host: hostId,
      status: "pending",
    })
      .populate("host","name email")
      .populate("host", "name email evStation")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    if (!session || session.status !== "STARTED") {
      return res.status(400).json({ message: "Invalid session" });
    }

    // Only host can end
    if (session.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    session.endTime = new Date();

    // Duration calculation
    const durationMs = session.endTime - session.startTime;
    const durationInMinutes = Math.ceil(durationMs / (1000 * 60));

    const host = await User.findById(session.host);

    const pricePerMinute = host.chargingPricePerUnit || 5;
    const totalCost = durationInMinutes * pricePerMinute;

    session.durationInMinutes = durationInMinutes;
    session.totalCost = totalCost;
    session.status = "COMPLETED";

    await session.save();

    // Razorpay Order
    const order = await razorpay.orders.create({
      amount: totalCost * 100, // paise
      currency: "INR",
      receipt: `session_${session._id}`,
    });

    res.json({
      success: true,
      message: "Session ended. Payment required.",
      data: {
        session,
        razorpayOrder: order,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};








// exports.endSession = async (req, res) => {
//   try {

// //     if (req.user.id.toString() !== session.host.toString()) {
// //   return res.status(403).json({ message: "Only host can end session" });
// // }

//     const { sessionId } = req.body;
//     console.log(req.body,"ll");

    

//     const session = await ChargingSession.findById(sessionId);
//     if (!session || session.status !== "STARTED") {
//       return res.status(400).json({ message: "Invalid session" });
//     }

//     session.endTime = new Date();
//     session.status = "COMPLETED";
//     await session.save();

//     res.json({
//       success: true,
//       message: "Charging session completed",
//       data: session,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };











