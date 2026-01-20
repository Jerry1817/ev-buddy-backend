const Station = require("../models/Station");
const ChargingRequest = require("../models/ChargingRequest");
const Chargingsession = require("../models/ChargingSession");
const Review = require("../models/Review");


/**
 * HOST → GET ALL REVIEWS
 * Fetches all reviews for the logged-in host
 */
exports.getHostReviews = async (req, res) => {
  try {
    const hostId = req.user.id;
    console.log(hostId,"hostId");
    

    // Fetch all reviews where this user is the host
    const reviewsRaw = await Review.find({ host: hostId })
      .populate("driver", "name email phone evModel")
      .populate("request", "requestedAt status")
      .sort({ createdAt: -1 }); // Most recent first

    // Enrich reviews with session data (for totalCost, duration, etc.)
    const reviews = await Promise.all(
      reviewsRaw.map(async (review) => {
        const reviewObj = review.toObject();
        
        // Find the associated charging session
        const session = await Chargingsession.findOne({ request: review.request._id || review.request });
        
        if (session) {
          reviewObj.session = {
            totalCost: session.totalCost || 0,
            energyConsumed: session.energyConsumed || 0,
            durationInMinutes: session.durationInMinutes || 0,
            startTime: session.startTime,
            endTime: session.endTime,
          };
        }
        
        return reviewObj;
      })
    );

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews,
          averageRating: parseFloat(averageRating),
          ratingDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Get host reviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};
/**
 * HOST → REGISTER STATION
 */
exports.registerStation = async (req, res) => {
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




/**
 * HOST → Start Charging Session
 * Called when driver has arrived and connected charger
 */
exports.startCharging = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { requestId } = req.params;

    // Find the request
    const request = await ChargingRequest.findOne({
      _id: requestId,
      host: hostId,
    }).populate("host", "evStation");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Validate status is ARRIVED
    if (request.status !== "ARRIVED") {
      return res.status(400).json({
        message: `Cannot start charging. Current status is ${request.status}. Driver must arrive first.`,
      });
    }

    // Get price per unit from host's evStation
    const pricePerUnit = request.host?.evStation?.chargingPricePerUnit || 10;

    // Create charging session
    const session = await Chargingsession.create({
      request: request._id,
      driver: request.driver,
      host: hostId,
      startTime: new Date(),
      pricePerUnit: pricePerUnit,
      startedBy: "HOST",
      status: "CHARGING",
    });

    // Update request status
    request.status = "ACTIVE";
    request.startedAt = new Date();
    await request.save();

    console.log("✅ Charging started by host:", session._id);

    res.status(200).json({
      success: true,
      message: "Charging started successfully",
      session,
      request,
    });
  } catch (error) {
    console.error("❌ Start charging error:", error);
    res.status(500).json({ message: "Failed to start charging" });
  }
};

/**
 * HOST → Stop Charging Session
 * Called when charging is complete
 */
exports.stopCharging = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { requestId } = req.params;

    // Find the request
    const request = await ChargingRequest.findOne({
      _id: requestId,
      host: hostId,
    }).populate("host", "evStation");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Validate status is ACTIVE
    if (request.status !== "ACTIVE") {
      return res.status(400).json({
        message: `Cannot stop charging. Current status is ${request.status}.`,
      });
    }

    // Find the active session
    const session = await Chargingsession.findOne({
      request: request._id,
      status: "CHARGING",
    });

    if (!session) {
      return res.status(404).json({ message: "Active session not found" });
    }

    // Calculate duration and cost
    const endTime = new Date();
    const startTime = session.startTime;
    const durationMs = endTime - startTime;
    const durationInMinutes = Math.ceil(durationMs / (1000 * 60));

    // Get power from host's evStation (kW)
    const power = request.host?.evStation?.power || 7;
    
    // Calculate energy consumed (kWh) = power (kW) * duration (hours)
    const durationInHours = durationInMinutes / 60;
    const energyConsumed = Math.round(power * durationInHours * 100) / 100;

    // Calculate total cost
    const pricePerUnit = session.pricePerUnit || 10;
    const totalCost = Math.round(energyConsumed * pricePerUnit * 100) / 100;

    // Update session
    session.endTime = endTime;
    session.durationInMinutes = durationInMinutes;
    session.energyConsumed = energyConsumed;
    session.totalCost = totalCost;
    session.stoppedBy = "HOST";
    session.status = "COMPLETED";
    await session.save();

    // Update request
    request.status = "COMPLETED";
    request.endedAt = endTime;
    request.totalDuration = durationInMinutes;
    request.totalCost = totalCost;
    await request.save();

    console.log("✅ Charging stopped by host. Duration:", durationInMinutes, "mins, Cost: ₹", totalCost);

    res.status(200).json({
      success: true,
      message: "Charging completed successfully",
      session,
      request,
      summary: {
        durationInMinutes,
        energyConsumed,
        totalCost,
      },
    });
  } catch (error) {
    console.error("❌ Stop charging error:", error);
    res.status(500).json({ message: "Failed to stop charging" });
  }
};






