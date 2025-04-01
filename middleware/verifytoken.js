const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");


const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.header("Authorization"); // Get token from headers

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const tokenValue = token.split(" ")[1]; // Extract token after "Bearer "
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
    
    const user = await UserModel.findById(decoded._id).select("-password"); // Exclude password field
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user; // Attach user object to `req`
    next(); // Proceed to the next middleware

  } catch (error) {
    return res.status(401).json({ error: "Invalid Token" });
  }
};

module.exports = isAuthenticated;
