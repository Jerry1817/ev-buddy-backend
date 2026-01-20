const Station = require("../models/Station");
const User = require("../models/User");


exports.getNearbyStations = async (req, res) => {
  try {
    const userId = req.user.id;
    

    const user = await User.findById(userId);

    if (!user || !user.location || !user.location.coordinates.length) {
      return res.status(400).json({
        success: false,
        message: "User location not found. Please set location first.",
      });
    }

    const { coordinates } = user.location; 

    // 2. Find nearby hosts (EV stations)
    const nearbyStations = await User.find({
      roles: "HOST",
      isHostActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: user.location.coordinates,
          },
          $maxDistance: 5000, // 5 km (you can change to 10000 = 10km)
        },
      },
    }).select(
      "evStation name address availableChargers"
    );


    res.status(200).json({
      success: true,
      count: nearbyStations.length,
       nearbyStations,
    });
  } catch (error) {
    console.error("Get nearby stations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



