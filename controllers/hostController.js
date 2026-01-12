const Station = require("../models/Station");
const ChargingRequest = require("../models/ChargingRequest");
const Chargingsession = require("../models/ChargingSession");



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
    console.log("ooooooooooooooooooooooooooooooooooooooo")
    const hostId = req.user.id;
    console.log(hostId,"sssssssss");
    

    const requests = await ChargingRequest.find({
      host: hostId,
    })
      .populate("driver","name email phone location")
      .populate("host", "name email evStation")
      .sort({ createdAt: -1 });

      console.log(requests,"lllllllll");
      

    res.status(200).json({
      success: true,
      count: requests.length,
       requests,
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











