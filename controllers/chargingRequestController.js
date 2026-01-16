const ChargingRequest = require("../models/ChargingRequest");
const User = require("../models/User");

exports.sendRequest = async (req, res) => {
  try {    

    const { hostid } = req.body;
    const driverId = req.user.id;

    if (!driverId) {
      return res.status(400).json({ message: "driverId ID required" });
    }

    // Find station
    const host = await User.findById(hostid);
    console.log(host,"kkkkkkkkkkkkkkk");
    
    if (!host) {
      return res.status(404).json({ message: "host not found" });
    }

     if (driverId === hostid) {
    return res.status(400).json({
      success: false,
      message: "You cannot request your own station",
    });
  }

    if (!host._id) {
      return res
        .status(400)
        .json({ message: " host not configured" });
    }

    // Prevent duplicate pending requests
    const existing = await ChargingRequest.findOne({
      driverId,
      hostid,
      status: "REQUESTED",
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Request already pending" });
    }

    // Create request
    const request = await ChargingRequest.create({
     driver: driverId,
     host: hostid,
      status: "REQUESTED",
    });

    res.status(201).json({
      message: "Request sent successfully",
     request,
    });
  } catch (error) {
    console.error("Send request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   HOST → Get all requests (pending / accepted / rejected)
   ====================================================== */
exports.getHostRequests = async (req, res) => {
  try {
    const hostId = req.user.id;
    const requests = await ChargingRequest.find({ hostId })
      .populate("userId", "name email phone")
      .populate("stationId", "name address power")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get host requests error:", error);
    res.status(500).json({ message: "Failed to load requests" });
  }
};

/* ======================================================
   HOST → Accept request
   ====================================================== */
exports.acceptRequest = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { requestId } = req.params;

    console.log(hostId,requestId,"ooo");
    

    const request = await ChargingRequest.findOne({
      _id: requestId,
      host:hostId,
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "ACCEPTED";
    await request.save();

    res.status(200).json({
      message: "Request accepted",
      request,
    });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   HOST → Reject request
   ====================================================== */
exports.rejectRequest = async (req, res) => {
  console.log("ok");
  
  try {
    const hostId = req.user.id;
    console.log(hostId,"hhh");
    
    const { requestId } = req.params;
    console.log(requestId,"oooooooooooooo");
    

    const request = await ChargingRequest.findOne({
      _id: requestId,
      host:hostId,
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "REJECTED";
    await request.save();

    res.status(200).json({
      message: "Request rejected",
      request,
    });
  } catch (error) {
    console.error("Reject request error:", error);
    res.status(500).json({ message: "Server error" });
  }
  // USER → Get own charging requests
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await ChargingRequest.find({ userId })
      .populate("stationId", "name address power")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user requests" });
  }
};

};
