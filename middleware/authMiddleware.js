const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user is blocked by admin
    if (req.user.isBlocked) {
      return res.status(403).json({ 
        blocked: true,
        message: "Your account has been blocked by admin. Please contact support." 
      });
    }
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
