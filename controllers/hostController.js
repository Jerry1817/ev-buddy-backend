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











