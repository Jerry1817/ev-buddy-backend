const ChargingRequest = require("../models/ChargingRequest");
const Station = require("../models/Station");

/* ======================================================
   USER → Send charging request
   ====================================================== */
exports.sendRequest = async (req, res) => {
  try {
    const { stationId } = req.body;
    const userId = req.user.id;

    if (!stationId) {
      return res.status(400).json({ message: "Station ID required" });
    }

    // Find station
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    if (!station.hostId) {
      return res
        .status(400)
        .json({ message: "Station host not configured" });
    }

    // Prevent duplicate pending requests
    const existing = await ChargingRequest.findOne({
      userId,
      stationId,
      status: "pending",
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Request already pending" });
    }

    // Create request
    const request = await ChargingRequest.create({
      userId,
      stationId,
      hostId: station.hostId,
      status: "pending",
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

    const request = await ChargingRequest.findOne({
      _id: requestId,
      hostId,
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "accepted";
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
  try {
    const hostId = req.user.id;
    const { requestId } = req.params;

    const request = await ChargingRequest.findOne({
      _id: requestId,
      hostId,
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "rejected";
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
