const Station = require("../models/Station");
const User = require("../models/User");

exports.getNearbyStations = async (req, res) => {
  const { latitude, longitude, distance = 5000 } = req.query;  

  const lat = Number(latitude);
  const lng = Number(longitude);
  const maxDistance = Number(distance);

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: "Latitude and longitude are required",
    });
  }

  const stations = await User.find({
    isHostActive: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistance,
      },
    },
  })  

  // if(stations==null){
  //   res.json({message:"no stations found",success:false})
  // }

  res.json({
    success: true,
    count: stations.length,
    data: stations,
  });
};


