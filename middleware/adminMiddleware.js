const jwt = require("jsonwebtoken");

/**
 * Admin Authentication Middleware
 * Verifies JWT token and checks for ADMIN role
 */
exports.adminProtect = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Not authorized, no token" 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the token belongs to an admin
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ 
      success: false,
      message: "Not authorized, token failed" 
    });
  }
};
