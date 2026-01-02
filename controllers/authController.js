const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
      data: user,
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
  const { stationName, address, availableChargers, location } = req.body;
  console.log(location,"ll");
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.roles = "HOST";
    user.isHost = true;
    user.evStation = { name: stationName, address, availableChargers };
      user.location = {
      type: "Point",
      coordinates: [
        Number(location.lng),
        Number(location.lat),
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
